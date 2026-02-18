import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
// import { MapPin, Camera, Navigation, CheckCircle } from 'lucide-react';
import { MapPin, Camera, Navigation, CheckCircle } from 'lucide-react';
import { socket } from '../services/socket';

// export const FieldWorker...

export const FieldWorker: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        // Mock: fetch tasks assigned to current user or department
        // For demo, fetch all 'in_progress' issues
        fetchIssues();

        socket.on('new_issue', (issue: any) => {
            if (issue.status === 'in_progress') {
                setTasks(prev => [issue, ...prev]);
            }
        });

        socket.on('issue_updated', (updatedIssue: any) => {
            if (updatedIssue.status === 'in_progress') {
                // Add if not exists, update if exists
                setTasks(prev => {
                    const exists = prev.find(t => t.id === updatedIssue.id);
                    if (exists) return prev.map(t => t.id === updatedIssue.id ? updatedIssue : t);
                    return [updatedIssue, ...prev];
                });
            } else {
                // Remove if no longer in progress
                setTasks(prev => prev.filter(t => t.id !== updatedIssue.id));
            }
        });

        return () => {
            socket.off('new_issue');
            socket.off('issue_updated');
        };
    }, []);

    const fetchIssues = async () => {
        const { data } = await supabase
            .from('issues')
            .select('*')
            .eq('status', 'in_progress');

        if (data) setTasks(data);
    };

    const markResolved = async (id: string) => {
        // In real app, upload "after" photo here
        await supabase.from('issues').update({ status: 'resolved' }).eq('id', id);
        fetchIssues();
    };

    return (
        <div className="p-4 pb-20 max-w-md mx-auto bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">My Tasks</h1>

            <div className="space-y-4">
                {tasks.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No active tasks assigned.</p>
                    </div>
                )}

                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${task.severity > 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    Priority {task.severity}/10
                                </span>
                                <h3 className="font-bold text-lg mt-2 capitalize">{task.category}</h3>
                            </div>
                            {task.image_url && (
                                <img src={task.image_url} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                            )}
                        </div>

                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{task.description}</p>

                        <div className="flex items-center text-sm text-slate-500 mb-4">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="truncate">{task.address || 'Location Coordinates'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
                                <Navigation className="w-4 h-4" />
                                Navigate
                            </button>
                            <button
                                onClick={() => markResolved(task.id)}
                                className="flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark Done
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
