import React, { useState, useEffect } from 'react';
import { History, Save } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';

const FollowUpBlock = ({ enquiryId, existingFollowUps = [], onSaveSuccess }) => {
    const { showToast } = useToast();
    const { getOptionList } = useOptions();
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [followUp, setFollowUp] = useState({
        followupMode: '',
        followupType: '',
        followupActionDone: '',
        followupCar: '',
        followupResults: '',
        followupRemarks: '',
        nextVisitDate: ''
    });

    useEffect(() => {
        setFollowUp({
            followupMode: '',
            followupType: '',
            followupActionDone: '',
            followupCar: '',
            followupResults: '',
            followupRemarks: '',
            nextVisitDate: ''
        });
        setShowHistory(false);
    }, [enquiryId]);

    // getOpt removed, using context helper

    const handleSave = async () => {
        if (!followUp.followupMode || !followUp.followupType || !followUp.followupActionDone || !followUp.followupResults) {
            showToast("All Follow-up fields are mandatory.", "warning");
            return;
        }

        const isGeneralQuery = (followUp.followupActionDone || "").toLowerCase() === "general-query";
        if (!isGeneralQuery && !followUp.followupCar) {
            showToast("Vehicle Number is mandatory for the selected Follow-up Action.", "warning");
            return;
        }

        if (!followUp.nextVisitDate) {
            showToast("Next Visit / Contact Date is mandatory.", "warning");
            return;
        }

        try {
            setLoading(true);
            await api.post('/follow-ups', {
                ...followUp,
                enquiryId,
                nextVisitDate: new Date(followUp.nextVisitDate)
            });
            showToast("Follow-up saved successfully", "success");

            // cleanup
            setFollowUp({
                followupMode: '',
                followupType: '',
                followupActionDone: '',
                followupCar: '',
                followupResults: '',
                followupRemarks: '',
                nextVisitDate: ''
            });

            if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
            console.error("Error saving follow-up", error);
            showToast("Failed to save follow-up: " + (error.response?.data?.error || error.message), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white ">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Schedule Follow-up</h3>
                {existingFollowUps && existingFollowUps.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <History className="h-4 w-4" /> {showHistory ? 'Hide Past Follow-ups' : 'View Past Follow-ups'}
                    </button>
                )}
            </div>

            {showHistory && existingFollowUps && (
                <div className="mb-4 bg-amber-50 rounded-lg border border-amber-100 overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-amber-100/50 text-amber-900 font-semibold border-b border-amber-200">
                            <tr>
                                <th className="p-2">Date / Agent</th>
                                <th className="p-2">Mode / Type</th>
                                <th className="p-2">Action / Car</th>
                                <th className="p-2">Result / Remarks</th>
                                <th className="p-2">Next Visit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                            {existingFollowUps.map((f, idx) => (
                                <tr key={f.followUpId || idx} className="hover:bg-amber-100/30">
                                    <td className="p-2 align-top">
                                        <div className="font-bold">{new Date(f.createdAt).toLocaleDateString()}</div>
                                        <div className="text-gray-500 truncate max-w-[100px]" title={f.agent?.fullName}>{f.agent?.fullName || 'Unknown'}</div>
                                    </td>
                                    <td className="p-2 align-top">
                                        <div className="font-medium">{f.followupMode}</div>
                                        <div className="text-gray-500">{f.followupType}</div>
                                    </td>
                                    <td className="p-2 align-top">
                                        <div className="font-medium">{f.followupActionDone}</div>
                                        {f.followupCar && <div className="text-gray-500 text-[10px]">{f.followupCar}</div>}
                                    </td>
                                    <td className="p-2 align-top">
                                        <div className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded w-fit mb-1 ${f.followupResults === 'not-interested' ? 'bg-red-100 text-red-700' :
                                            f.followupResults === 'sale-closed' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {f.followupResults}
                                        </div>
                                        <div className="text-gray-600 italic leading-tight">{f.followupRemarks}</div>
                                    </td>
                                    <td className="p-2 align-top font-medium text-gray-700">
                                        {f.nextVisitDate ? new Date(f.nextVisitDate).toLocaleString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 font-medium">Mode <span className="text-red-500">*</span></label>
                    <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupMode} onChange={e => setFollowUp({ ...followUp, followupMode: e.target.value })}>
                        <option value="">Select...</option>
                        {getOptionList('FOLLOWUP_MODES').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 font-medium">Type <span className="text-red-500">*</span></label>
                    <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupType} onChange={e => setFollowUp({ ...followUp, followupType: e.target.value })}>
                        <option value="">Select...</option>
                        {getOptionList('FOLLOWUP_TYPES').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-xs text-gray-500 font-medium">Action Done <span className="text-red-500">*</span></label>
                    <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupActionDone} onChange={e => setFollowUp({ ...followUp, followupActionDone: e.target.value })}>
                        <option value="">Select...</option>
                        {getOptionList('FOLLOWUP_ACTIONS').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">
                        Vehicle Number {(followUp.followupActionDone || "").toLowerCase() === "general-query" ? "(Optional)" : "*"}
                    </label>
                    <input className="border p-2 rounded h-[42px]" placeholder="Vehicle Number (Visiting)" value={followUp.followupCar || ''} onChange={e => setFollowUp({ ...followUp, followupCar: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-xs text-gray-500 font-medium">Results <span className="text-red-500">*</span></label>
                    <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupResults} onChange={e => setFollowUp({ ...followUp, followupResults: e.target.value })}>
                        <option value="">Select...</option>
                        {getOptionList('FOLLOWUP_RESULTS').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 font-medium">Next Visit / Contact <span className="text-red-500">*</span></label>
                    <input type="datetime-local" className="w-full border p-2 rounded" value={followUp.nextVisitDate || ''} onChange={e => setFollowUp({ ...followUp, nextVisitDate: e.target.value })} />
                </div>
            </div>
            <div className="mt-4">
                <textarea className="w-full border p-2 rounded" rows={2} placeholder="Follow-up Remarks..." value={followUp.followupRemarks || ''} onChange={e => setFollowUp({ ...followUp, followupRemarks: e.target.value })} />
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-amber-100">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                >
                    <Save size={16} /> {loading ? 'Saving...' : 'Save Follow-up'}
                </button>
            </div>
        </div>
    );
};

export default FollowUpBlock;
