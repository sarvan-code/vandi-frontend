import React from 'react';
import clsx from 'clsx';

const Table = ({ columns, data, onEdit, onDelete }) => {
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
                                    idx === 0 && "sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]", // Sticky first col header
                                    col.key === 'actions' && "sticky right-0 z-30 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                                    // If last col in data columns, check if actions exist. If no actions, maybe sticky? usually Actions is separate.
                                    // Here only First Col and Action Col are requested.
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
                        data.map((item, index) => (
                            <tr key={index}>
                                {columns.map((col, idx) => (
                                    <td
                                        key={col.key}
                                        className={clsx(
                                            "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 bg-white",
                                            idx === 0 && "sticky left-0 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] border-r border-gray-100",
                                            col.key === 'actions' && "sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] border-l border-gray-100"
                                        )}
                                    >
                                        {col.render ? col.render(item) : item[col.key]}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 sticky right-0 z-10 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)] border-l border-gray-100">
                                        {/* Keep existing onEdit/onDelete logic, but usually actions are passed in columns for complex logic. 
                                            If passed in columns, they are rendered in previous map. 
                                            However, generic Table often keeps Actions separate. 
                                            The Enquiries.jsx passes 'actions' as a column in `columns`.
                                            Wait, if 'actions' is in `columns`, it overlaps with this separate block?
                                            Checking Enquiries.jsx: `const columns = [ ... { key: 'actions', ... } ]`.
                                            So Enquiries.jsx renders actions INSIDE the column map.
                                            But Table.jsx has `{(onEdit || onDelete) && ...}`.
                                            If Enquiries.jsx uses `columns` for actions, then `onEdit` and `onDelete` props might be unused there.
                                            Let's check usage in Enquiries.jsx: `<Table columns={columns} data={enquiries} />`. 
                                            It does NOT pass onEdit/onDelete.
                                            So the actions are rendered inside the standard columns map loop.
                                            In that case, the "Last Column" logic needs to target the last item of `columns` map.
                                        */}
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

                                        {/* If no onEdit/onDelete, this block shouldn't render unless we force it or handle it in main loop. 
                                            Actually, if Actions are in `columns`, `idx === columns.length - 1` is the check.
                                            Let's Refactor the main loop to handle sticky last column if no separate action prop is used.
                                        */}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}

                </tbody>
            </table>
        </div>
    );
};

export default Table;
