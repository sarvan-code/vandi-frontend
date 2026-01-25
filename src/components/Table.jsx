import React from 'react';
import clsx from 'clsx';

const Table = ({ columns, data, onEdit, onDelete, onRowClick, selectedRow, rowKey = 'index' }) => {
    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={clsx(
                                    "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 bg-gray-50",
                                    idx === 0 && "sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]",
                                    col.key === 'actions' && "sticky right-0 z-30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                                )}
                            >
                                {col.label}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 sticky right-0 z-30 bg-gray-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="py-4 text-center text-gray-500">
                                No data available
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
                                        "transition-colors duration-150",
                                        onRowClick && "cursor-pointer hover:bg-gray-50",
                                        isSelected && "bg-blue-50 hover:bg-blue-100"
                                    )}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={col.key}
                                            className={clsx(
                                                "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6",
                                                idx === 0 && "sticky left-0 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] border-r border-gray-100",
                                                col.key === 'actions' && "sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] border-l border-gray-100",
                                                isSelected ? "bg-blue-50" : "bg-white"
                                            )}
                                        >
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className={clsx(
                                            "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] border-l border-gray-100",
                                            isSelected ? "bg-blue-50" : "bg-white"
                                        )}>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
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
