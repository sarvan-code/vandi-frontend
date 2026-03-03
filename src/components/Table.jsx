import React from 'react';
import clsx from 'clsx';

const Table = ({ columns, data, onEdit, onDelete, onRowClick, selectedRow, rowKey = 'index' }) => {
    return (
        <div className="overflow-x-auto card">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead style={{ background: 'var(--bg-tertiary)' }} className="sticky top-0 z-20">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={clsx(
                                    "py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider",
                                    idx === 0 && "sticky left-0 z-30",
                                    col.key === 'actions' && "sticky right-0 z-30"
                                )}
                                style={{
                                    color: 'var(--text-secondary)',
                                    ...(idx === 0 || col.key === 'actions' ? { background: 'var(--bg-tertiary)' } : {})
                                }}
                            >
                                {col.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th scope="col" className="relative py-3 pl-3 pr-4 sticky right-0 z-30" style={{ background: 'var(--bg-tertiary)' }}>
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="py-12 text-center">
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No records found.</p>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            const rowKeyValue = rowKey === 'index' ? index : item[rowKey];
                            const isSelected = selectedRow !== undefined && selectedRow !== null &&
                                (rowKey === 'index' ? selectedRow === index : selectedRow === item[rowKey]);

                            return (
                                <tr
                                    key={rowKeyValue}
                                    onClick={() => onRowClick && onRowClick(item, index)}
                                    className={clsx(
                                        "transition-colors",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    style={{
                                        background: isSelected ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                                    }}
                                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={col.key}
                                            className={clsx(
                                                "whitespace-nowrap py-3 pl-4 pr-3 text-sm",
                                                idx === 0 && "sticky left-0 z-10",
                                                col.key === 'actions' && "sticky right-0 z-10"
                                            )}
                                            style={{
                                                color: 'var(--text-primary)',
                                                background: isSelected ? 'var(--accent-bg)' : 'inherit',
                                                ...(isSelected && idx === 0 ? { borderLeft: '3px solid var(--accent)' } : {})
                                            }}
                                        >
                                            {col.render ? col.render(item) : (
                                                <span className="truncate block max-w-[200px]">
                                                    {item[col.key]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm sticky right-0 z-10"
                                            style={{ background: isSelected ? 'var(--accent-bg)' : 'inherit' }}
                                        >
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                        className="px-2 py-1 text-xs rounded hover:bg-[var(--accent-bg)] transition-colors"
                                                        style={{ color: 'var(--accent)' }}
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                        className="px-2 py-1 text-xs rounded hover:bg-[var(--danger-bg)] transition-colors"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Delete"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
