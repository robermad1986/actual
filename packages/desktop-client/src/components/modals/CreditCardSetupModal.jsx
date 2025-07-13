import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { send } from 'loot-core/src/platform/client/fetch';

import { Button } from '../../../common/Button2';
import { Modal, ModalTitle } from '../../../common/Modal';
import { Text } from '../../../common/Text';
import { View } from '../../../common/View';
import { SectionLabel } from '../../../common/SectionLabel';
import { InlineField } from '../../../common/InlineField';
import { Checkbox } from '../../../common/Checkbox';

import { validateCreditCardSetup, CREDIT_CARD_ACCOUNT_TYPES } from 'loot-core/shared/credit-card-utils';

export function CreditCardSetupModal({ accountId, accountName, onClose, onComplete }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState(null);
    const [categories, setCategories] = useState([]);
    const [setupOptions, setSetupOptions] = useState({
        accountType: CREDIT_CARD_ACCOUNT_TYPES.ON_BUDGET,
        createDebtCategory: true,
        enableScheduledPayments: true,
        enableAutoCategorization: true
    });
    const [validationIssues, setValidationIssues] = useState([]);

    useEffect(() => {
        async function loadAccountData() {
            setLoading(true);
            try {
                // Load account details
                const accountData = await send('account-get', { id: accountId });
                setAccount(accountData);

                // Load categories
                const categoriesData = await send('categories-get');
                setCategories(categoriesData);

                // Validate current setup
                const issues = validateCreditCardSetup(accountData, categoriesData);
                setValidationIssues(issues);
            } catch (error) {
                console.error('Failed to load account data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (accountId) {
            loadAccountData();
        }
    }, [accountId]);

    const handleSetupComplete = async () => {
        setLoading(true);
        try {
            // Update account type if needed
            if (account.offbudget && setupOptions.accountType === CREDIT_CARD_ACCOUNT_TYPES.ON_BUDGET) {
                await send('account-update', {
                    id: accountId,
                    offbudget: false
                });
            }

            // Create debt category if requested and doesn't exist
            if (setupOptions.createDebtCategory && account.balance < 0) {
                const existingDebtCategory = categories.find(cat =>
                    cat.name.toLowerCase().includes('credit card') &&
                    cat.name.toLowerCase().includes('debt')
                );

                if (!existingDebtCategory) {
                    await send('category-create', {
                        name: `${accountName} Debt`,
                        is_income: false,
                        group_id: null // Will be assigned to default group
                    });
                }
            }

            // Set up scheduled payment if requested
            if (setupOptions.enableScheduledPayments) {
                // This would integrate with Actual's schedules functionality
                // For now, we'll just notify the user to set it up manually
                console.log('User should set up scheduled payments manually');
            }

            onComplete(setupOptions);
        } catch (error) {
            console.error('Failed to complete credit card setup:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Modal title="Setting Up Credit Card">
                <View style={{ alignItems: 'center', padding: 20 }}>
                    <Text>Loading account information...</Text>
                </View>
            </Modal>
        );
    }

    return (
        <Modal title={`Credit Card Setup: ${accountName}`} onClose={onClose}>
            <View style={{ width: 500, gap: 20 }}>

                {/* Current Status */}
                <View>
                    <SectionLabel title="Current Account Status" />
                    {account && (
                        <View style={{ gap: 10 }}>
                            <Text>
                                <strong>Account Type:</strong> {account.offbudget ? 'Off-Budget' : 'On-Budget'}
                            </Text>
                            <Text>
                                <strong>Current Balance:</strong> {account.balance < 0 ?
                                    `-$${Math.abs(account.balance / 100).toFixed(2)} (debt)` :
                                    `$${(account.balance / 100).toFixed(2)}`
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {/* Validation Issues */}
                {validationIssues.length > 0 && (
                    <View>
                        <SectionLabel title="Recommendations" />
                        <View style={{ gap: 8 }}>
                            {validationIssues.map((issue, index) => (
                                <View key={index} style={{
                                    padding: 10,
                                    backgroundColor: issue.type === 'warning' ? '#fff3cd' : '#d1ecf1',
                                    borderRadius: 4,
                                    border: `1px solid ${issue.type === 'warning' ? '#ffeaa7' : '#bee5eb'}`
                                }}>
                                    <Text style={{
                                        color: issue.type === 'warning' ? '#856404' : '#0c5460',
                                        fontSize: 14
                                    }}>
                                        {issue.message}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Setup Options */}
                <View>
                    <SectionLabel title="Setup Options" />

                    <View style={{ gap: 15 }}>

                        {/* Account Type */}
                        <InlineField label="Account Management">
                            <View style={{ gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="radio"
                                        checked={setupOptions.accountType === CREDIT_CARD_ACCOUNT_TYPES.ON_BUDGET}
                                        onChange={() => setSetupOptions(prev => ({
                                            ...prev,
                                            accountType: CREDIT_CARD_ACCOUNT_TYPES.ON_BUDGET
                                        }))}
                                    />
                                    <Text>On-Budget (Recommended)</Text>
                                </label>
                                <Text style={{ fontSize: 12, color: '#666', marginLeft: 20 }}>
                                    Track all purchases in budget categories. Pay in full monthly.
                                </Text>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="radio"
                                        checked={setupOptions.accountType === CREDIT_CARD_ACCOUNT_TYPES.OFF_BUDGET}
                                        onChange={() => setSetupOptions(prev => ({
                                            ...prev,
                                            accountType: CREDIT_CARD_ACCOUNT_TYPES.OFF_BUDGET
                                        }))}
                                    />
                                    <Text>Off-Budget</Text>
                                </label>
                                <Text style={{ fontSize: 12, color: '#666', marginLeft: 20 }}>
                                    Not recommended for active credit cards.
                                </Text>
                            </View>
                        </InlineField>

                        {/* Debt Category */}
                        {account && account.balance < 0 && (
                            <InlineField label="Existing Debt">
                                <View style={{ gap: 8 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Checkbox
                                            checked={setupOptions.createDebtCategory}
                                            onChange={(checked) => setSetupOptions(prev => ({
                                                ...prev,
                                                createDebtCategory: checked
                                            }))}
                                        />
                                        <Text>Create "Credit Card Debt" category</Text>
                                    </label>
                                    <Text style={{ fontSize: 12, color: '#666', marginLeft: 20 }}>
                                        Track and gradually pay down existing debt balance.
                                    </Text>
                                </View>
                            </InlineField>
                        )}

                        {/* Scheduled Payments */}
                        <InlineField label="Automation">
                            <View style={{ gap: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Checkbox
                                        checked={setupOptions.enableScheduledPayments}
                                        onChange={(checked) => setSetupOptions(prev => ({
                                            ...prev,
                                            enableScheduledPayments: checked
                                        }))}
                                    />
                                    <Text>Set up monthly payment reminders</Text>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Checkbox
                                        checked={setupOptions.enableAutoCategorization}
                                        onChange={(checked) => setSetupOptions(prev => ({
                                            ...prev,
                                            enableAutoCategorization: checked
                                        }))}
                                    />
                                    <Text>Enable automatic merchant categorization</Text>
                                </label>
                            </View>
                        </InlineField>
                    </View>
                </View>

                {/* Best Practices Info */}
                <View style={{
                    padding: 15,
                    backgroundColor: '#e8f5e8',
                    borderRadius: 6,
                    border: '1px solid #c3e6c3'
                }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#2d5a2d' }}>
                        Credit Card Best Practices:
                    </Text>
                    <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 14, color: '#2d5a2d' }}>
                            • Budget money into spending categories first
                        </Text>
                        <Text style={{ fontSize: 14, color: '#2d5a2d' }}>
                            • Use credit card for budgeted purchases only
                        </Text>
                        <Text style={{ fontSize: 14, color: '#2d5a2d' }}>
                            • Pay full balance monthly to avoid debt
                        </Text>
                        <Text style={{ fontSize: 14, color: '#2d5a2d' }}>
                            • Treat payments as transfers, not expenses
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 20
                }}>
                    <Button onPress={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onPress={handleSetupComplete}
                        disabled={loading}
                    >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                    </Button>
                </View>
            </View>
        </Modal>
    );
}

export default CreditCardSetupModal;
