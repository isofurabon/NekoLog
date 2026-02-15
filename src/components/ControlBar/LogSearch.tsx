import { Search, X, Filter, Check } from 'lucide-react';
import React, { useCallback } from 'react';
import { useAtom } from 'jotai';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { filterTextAtom, includedFieldsAtom } from '@/store';
import { SEARCHABLE_FIELDS, type SearchableField } from '@/constants/search.ts';
import { useClickOutside } from '@/hooks/useClickOutside.ts';

interface LogSearchProps {
    onClose: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export const LogSearch = ({ onClose, inputRef }: LogSearchProps) => {
    const [filterText, setFilterText] = useAtom(filterTextAtom);

    React.useEffect(() => {
        // Focus on mount with a slight delay to ensure animation/layout readiness
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }, [inputRef]);

    const handleBlur = (e: React.FocusEvent) => {
        // Don't close if focus moved to another element within the same container
        // (e.g. filter menu button, or component unmounting during file drop)
        if (e.relatedTarget && e.currentTarget.closest('[data-testid="control-bar-container"]')?.contains(e.relatedTarget as Node)) {
            return;
        }
        if (!filterText) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            inputRef.current?.blur();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(e.target.value);
    };

    const clearFilter = () => {
        setFilterText('');
        inputRef.current?.focus();
    };

    return (
        <div className="flex items-center w-full h-full px-3 gap-2">
            <Search size={18} className="text-gray-400" />
            <input
                ref={inputRef}
                type="text"
                placeholder="Filter logs... (Ctrl+K or Cmd+K)"
                className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono placeholder-gray-500 h-full"
                value={filterText}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            {filterText && (
                <button type="button" onClick={clearFilter} className="p-1 hover:bg-white/10 rounded-full">
                    <X size={14} className="text-gray-400" />
                </button>
            )}

            <FilterMenu />
        </div>
    );
};

const FilterMenu = () => {
    const [includedFields, setIncludedFields] = useAtom(includedFieldsAtom);
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    const toggleField = useCallback((field: SearchableField) => {
        setIncludedFields((prev: SearchableField[]) =>
            prev.includes(field)
                ? prev.filter((f: SearchableField) => f !== field)
                : [...prev, field]
        );
    }, [setIncludedFields]);

    const handleClose = useCallback(() => setIsOpen(false), []);
    useClickOutside(menuRef, handleClose, isOpen);

    const isActive = includedFields.length > 0;

    return (
        <div className="relative flex items-center" ref={menuRef}>
            <button type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "p-1 rounded-md transition-colors",
                    isOpen ? "bg-white/10" : "hover:bg-white/10",
                    isOpen || isActive ? "text-blue-400" : "text-gray-400"
                )}
                title="Filter Fields"
            >
                <Filter size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="absolute right-0 top-full mt-5 w-48 bg-surface0 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {SEARCHABLE_FIELDS.map(field => {
                            const isIncluded = includedFields.includes(field);
                            return (
                                <label key={field} className="flex items-center px-3 py-2 hover:bg-surface1/50 cursor-pointer transition-colors group">
                                    <div className={clsx(
                                        "w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors",
                                        isIncluded ? "bg-blue-500 border-blue-500" : "border-gray-500"
                                    )}>
                                        {isIncluded && <Check size={10} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <span className={clsx(
                                        "text-sm capitalize transition-colors",
                                        isIncluded ? "text-gray-100" : "text-gray-500"
                                    )}>{field}</span>
                                    <input
                                        type="checkbox"
                                        checked={isIncluded}
                                        onChange={() => toggleField(field)}
                                        className="hidden"
                                    />
                                </label>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
