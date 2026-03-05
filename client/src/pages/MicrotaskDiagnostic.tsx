/**
 * DIAGNOSTIC PAGE — visit /admin/microtask-debug to run tests
 * Delete this file after debugging is complete.
 */
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems } from '../constants/adminNav';
import { LayoutDashboard, ClipboardCheck, Shield, Target, Radio, BarChart3 } from 'lucide-react';

export const MicrotaskDiagnostic: React.FC = () => {
    const { user, profile } = useAuth();
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLog(prev => [...prev, msg]);
    };

    const runTests = async () => {
        setLog([]);
        addLog('=== MICROTASK DIAGNOSTIC ===');
        addLog(`User ID: ${user?.id || 'NOT LOGGED IN'}`);
        addLog(`Profile ID: ${profile?.id || 'MISSING'}`);
        addLog(`Profile role: ${profile?.role || 'MISSING'}`);
        addLog('');

        // Test 1: Can we read microtasks table?
        addLog('TEST 1: Reading microtasks table...');
        const { data: readData, error: readError } = await (supabase.from('microtasks') as any)
            .select('id')
            .limit(1);
        if (readError) {
            addLog(`❌ READ FAILED: ${readError.code} — ${readError.message}`);
            addLog(`   Detail: ${readError.details}`);
            addLog(`   Hint: ${readError.hint}`);
        } else {
            addLog(`✅ READ OK — found ${readData?.length ?? 0} existing tasks`);
        }

        // Test 2: Can we insert a minimal microtask?
        addLog('');
        addLog('TEST 2: Inserting minimal microtask (no FK)...');
        const minimalPayload = {
            title: '__DIAGNOSTIC_TEST__',
            task_type: 'image',
            points: 1,
            status: 'open',
            end_time: new Date(Date.now() + 3600000).toISOString(),
            // deliberately NO created_by to isolate FK issues
        };
        addLog(`   Payload: ${JSON.stringify(minimalPayload)}`);
        const { data: insertData, error: insertError } = await (supabase.from('microtasks') as any)
            .insert(minimalPayload)
            .select()
            .single();
        if (insertError) {
            addLog(`❌ INSERT FAILED: ${insertError.code} — ${insertError.message}`);
            addLog(`   Detail: ${insertError.details}`);
            addLog(`   Hint: ${insertError.hint}`);
        } else {
            addLog(`✅ INSERT OK — new task ID: ${insertData?.id}`);

            // Cleanup
            await (supabase.from('microtasks') as any).delete().eq('id', insertData.id);
            addLog('   (cleaned up test row)');
        }

        // Test 3: Insert with created_by
        if (profile?.id) {
            addLog('');
            addLog('TEST 3: Inserting with created_by (profile FK)...');
            const withFKPayload = {
                title: '__DIAGNOSTIC_TEST_FK__',
                task_type: 'image',
                points: 1,
                status: 'open',
                end_time: new Date(Date.now() + 3600000).toISOString(),
                created_by: profile.id,
            };
            addLog(`   Payload: ${JSON.stringify(withFKPayload)}`);
            const { data: d2, error: e2 } = await (supabase.from('microtasks') as any)
                .insert(withFKPayload)
                .select()
                .single();
            if (e2) {
                addLog(`❌ INSERT WITH FK FAILED: ${e2.code} — ${e2.message}`);
                addLog(`   Detail: ${e2.details}`);
                addLog(`   Hint: ${e2.hint}`);
            } else {
                addLog(`✅ INSERT WITH FK OK — ID: ${d2?.id}`);
                await (supabase.from('microtasks') as any).delete().eq('id', d2.id);
                addLog('   (cleaned up test row)');
            }
        } else {
            addLog('⚠️  SKIPPED TEST 3: profile.id is missing');
        }

        // Test 4: Check if civic_points table exists
        addLog('');
        addLog('TEST 4: Reading civic_points...');
        const { error: cpErr } = await (supabase.from('civic_points') as any).select('id').limit(1);
        if (cpErr) {
            addLog(`❌ civic_points READ FAILED: ${cpErr.message}`);
        } else {
            addLog('✅ civic_points table OK');
        }

        // Test 5: Check microtask_responses
        addLog('');
        addLog('TEST 5: Reading microtask_responses...');
        const { error: mrErr } = await (supabase.from('microtask_responses') as any).select('id').limit(1);
        if (mrErr) {
            addLog(`❌ microtask_responses READ FAILED: ${mrErr.message}`);
        } else {
            addLog('✅ microtask_responses table OK');
        }

        addLog('');
        addLog('=== DONE ===');
    };

    const navItems = adminNavItems;

    return (
        <MinimalLayout navItems={navItems} title="System Diagnostics">
            <div className="p-8 font-mono bg-[#0a0a0a] min-h-screen text-[#00ff88]">
                <h1 className="text-xl mb-4">🔬 Microtask Diagnostic</h1>
                <button
                    onClick={runTests}
                    className="px-6 py-3 bg-[#00ff88] text-black font-black border-none rounded-xl cursor-pointer mb-6 text-sm"
                >
                    ▶ Run All Tests
                </button>
                <div className="bg-[#111] rounded-xl p-6 border border-[#222]">
                    {log.length === 0
                        ? <p className="opacity-30">Press "Run All Tests" to start...</p>
                        : log.map((line, i) => (
                            <div key={i} className={`py-1
                                ${line.startsWith('❌') ? 'text-[#ff4444]' : line.startsWith('✅') ? 'text-[#00ff88]' : line.startsWith('⚠️') ? 'text-[#ffaa00]' : line.startsWith('===') ? 'text-white' : 'text-[#88ff88]'}
                                ${line.startsWith('   ') ? 'opacity-60' : 'opacity-100'}
                            `}>
                                {line || <br />}
                            </div>
                        ))
                    }
                </div>
            </div>
        </MinimalLayout>
    );
};
