import React from 'react';
import { motion } from 'framer-motion';

type Role = 'citizen' | 'worker' | 'admin';

interface RoleSelectorProps {
    selectedRole: Role;
    onRoleSelect: (role: Role) => void;
}

const roles: { id: Role; label: string }[] = [
    { id: 'citizen', label: 'Citizen' },
    { id: 'worker', label: 'Worker' },
    { id: 'admin', label: 'Admin' },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect }) => {
    return (
        <div className="flex gap-3 mb-8 justify-center">
            {roles.map((role) => (
                <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onRoleSelect(role.id)}
                    className={`px-6 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${selectedRole === role.id
                            ? 'bg-brand-secondary text-brand-primary border-brand-secondary'
                            : 'bg-transparent text-brand-secondary/60 border-brand-secondary/10 hover:border-brand-secondary/30'
                        }`}
                >
                    {role.label}
                </motion.button>
            ))}
        </div>
    );
};
