// WithdrawFundsModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { GREEN, ScreenRings, StatCard, shopTheme } from "../hivemarket-shop-dashboard/app/Shop/components/ui";

const PRIMARY = '#008100';
const PRIMARY_SOFT = '#e8f5e9';

interface Bank { name: string; code: string; }

interface WithdrawFundsModalProps {
  visible: boolean;
  onClose: () => void;
  balance: number;
  isDark: boolean;
  theme: any;
  banks: Bank[];
  loadingBanks: boolean;
  fetchBanks: () => void;
  resolveAccount: (accountNumber: string, bankCode: string) => Promise<string | null>;
  resolving: boolean;
  resolvedName: string | null;
  resolveError: string | null;
  resetResolve: () => void;
  submitting: boolean;
  onSubmit: (data: { amount: number; bankName: string; bankCode: string; accountNumber: string; accountName: string }) => void;
}

type Step = 'amount' | 'bank';

export const WithdrawFundsModal = ({
  visible, onClose, balance, isDark, theme, banks, loadingBanks, fetchBanks,
  resolveAccount, resolving, resolvedName, resolveError, resetResolve, submitting, onSubmit,
}: WithdrawFundsModalProps) => {

  //const isDark= useColorScheme() === "dark";
  //const theme  = shopTheme(isDark);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && banks.length === 0) fetchBanks();
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    resetResolve();
    if (accountNumber.length === 10 && selectedBank) {
      debounceRef.current = setTimeout(() => resolveAccount(accountNumber, selectedBank.code), 500);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [accountNumber, selectedBank]);

  const resetAll = () => {
    setStep('amount'); setAmount(''); setSelectedBank(null);
    setAccountNumber(''); setBankSearch(''); resetResolve();
  };
  const handleClose = () => { resetAll(); onClose(); };

  const amountValid = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && parseFloat(amount) <= balance;

  const handleConfirm = () => {
    if (!selectedBank || !resolvedName) return;
    onSubmit({ amount: parseFloat(amount), bankName: selectedBank.name, bankCode: selectedBank.code, accountNumber, accountName: resolvedName });
  };

  const filteredBanks = banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.bg }]}>
          {step === 'amount' && (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Withdraw Funds</Text>
              <Text style={[styles.subtitle, { color: theme.label }]}>Available Balance: ₦{balance.toFixed(2)}</Text>
              <TextInput
                placeholder="Enter amount"
                placeholderTextColor={theme.label}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, borderColor: isDark ? PRIMARY : '#c8e6c9', backgroundColor: isDark ? '#0a1f0a' : PRIMARY_SOFT }]}
              />
              <View style={styles.row}>
                <Pressable style={[styles.btn, styles.btnGray]} onPress={handleClose}>
                  <Text style={styles.btnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.btn, { backgroundColor: PRIMARY, opacity: amountValid ? 1 : 0.5 }]} onPress={() => setStep('bank')} disabled={!amountValid}>
                  <Text style={styles.btnText}>Next</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 'bank' && (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Bank Details</Text>
              <Text style={[styles.subtitle, { color: theme.label }]}>Withdrawing ₦{parseFloat(amount).toFixed(2)}</Text>

              <Pressable
                style={[styles.input, styles.bankSelector, { borderColor: isDark ? PRIMARY : '#c8e6c9', backgroundColor: isDark ? '#0a1f0a' : PRIMARY_SOFT }]}
                onPress={() => setShowBankPicker(true)}
              >
                <Text style={{ color: selectedBank ? theme.text : theme.label }}>{selectedBank ? selectedBank.name : 'Select bank'}</Text>
              </Pressable>

              {selectedBank && (
                <TextInput
                  placeholder="10-digit account number"
                  placeholderTextColor={theme.label}
                  value={accountNumber}
                  onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={[styles.input, { color: theme.text, borderColor: isDark ? PRIMARY : '#c8e6c9', backgroundColor: isDark ? '#0a1f0a' : PRIMARY_SOFT }]}
                />
              )}

              {resolving && (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                  <Text style={[styles.statusText, { color: theme.label }]}>Verifying account...</Text>
                </View>
              )}
              {resolvedName && (
                <View style={[styles.statusRow, { backgroundColor: PRIMARY_SOFT, padding: 8, borderRadius: 8 }]}>
                  <Text style={[styles.statusText, { color: PRIMARY, fontWeight: '700' }]}>✓ {resolvedName}</Text>
                </View>
              )}
              {resolveError && <Text style={[styles.statusText, { color: '#c62828' }]}>{resolveError}</Text>}

              <View style={styles.row}>
                <Pressable style={[styles.btn, styles.btnGray]} onPress={() => setStep('amount')}>
                  <Text style={styles.btnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, { backgroundColor: PRIMARY, opacity: resolvedName && !submitting ? 1 : 0.5 }]}
                  onPress={handleConfirm}
                  disabled={!resolvedName || submitting}
                >
                  <Text style={styles.btnText}>{submitting ? 'Processing...' : 'Confirm Withdrawal'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      <Modal visible={showBankPicker} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.content, { backgroundColor: theme.bg, maxHeight: '70%' }]}>
            <Text style={[styles.title, { color: theme.text }]}>Select Bank</Text>
            <TextInput
              placeholder="Search banks"
              placeholderTextColor={theme.label}
              value={bankSearch}
              onChangeText={setBankSearch}
              style={[styles.input, { color: theme.text, borderColor: isDark ? PRIMARY : '#c8e6c9', backgroundColor: isDark ? '#0a1f0a' : PRIMARY_SOFT }]}
            />
            {loadingBanks ? (
              <ActivityIndicator size="large" color={PRIMARY} />
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item, index) =>
                `${item.code ?? item.name ?? 'bank'}-${index}`
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.bankItem}
                    onPress={() => { setSelectedBank(item); setAccountNumber(''); resetResolve(); setShowBankPicker(false); }}
                  >
                    <Text style={{ color: theme.text }}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
            <Pressable style={[styles.btn, styles.btnGray, { marginTop: 10 }]} onPress={() => setShowBankPicker(false)}>
              <Text style={styles.btnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { borderRadius: 16, padding: 20, width: '85%', gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginBottom: 4 },
  input: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, fontWeight: '500' },
  bankSelector: { justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnGray: { backgroundColor: '#999' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12 },
  bankItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});