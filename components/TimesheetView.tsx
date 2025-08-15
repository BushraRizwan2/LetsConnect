import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Timesheet, TimesheetStatus, PayType, EmployeeType, UserRole, LeaveRequest, LeaveStatus, TimePunch } from '../types';
import { ClockIcon, CalendarDaysIcon, DocumentTextIcon, CogIcon, ClipboardDocumentListIcon, MagnifyingGlassIcon, BellIcon, CheckIcon, ViewColumnsIcon, ExclamationTriangleIcon, UserPlusIcon, UsersIcon, CurrencyDollarIcon, CheckCircleIcon, UserCircleIcon, ChevronLeftIcon } from './icons';

const getAvatarUrl = (name: string, url?: string) => {
    if (url) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=393B44&color=FFFFFF&rounded=true`;
}

// --- Helper Components ---

const TabButton: React.FC<{ label: string, icon: React.FC<{className?: string}>, isActive: boolean, onClick: () => void }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
    >
        <Icon className="w-5 h-5" />
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

// --- Detailed Employee Timesheet View ---
const EmployeeDetailTimesheetView: React.FC<{ employee: User; onBack: () => void; isSelfView?: boolean }> = ({ employee, onBack, isSelfView = false }) => {
    const { timePunches } = useAppContext();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const dailyPunches = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);

        const userPunches = timePunches.filter(p => p.userId === employee.id && new Date(p.timestamp) >= start && new Date(p.timestamp) <= end);
        const punchesByDay: Record<string, { checkIn?: string, checkOut?: string, breakStart?: string, breakEnd?: string }> = {};
        
        userPunches.forEach(punch => {
            const date = new Date(punch.timestamp);
            const dayKey = date.toISOString().split('T')[0];
            if (!punchesByDay[dayKey]) punchesByDay[dayKey] = {};
            if (punch.type === 'in') punchesByDay[dayKey].checkIn = punch.timestamp;
            if (punch.type === 'out') punchesByDay[dayKey].checkOut = punch.timestamp;
            if (punch.type === 'break-start') punchesByDay[dayKey].breakStart = punch.timestamp;
            if (punch.type === 'break-end') punchesByDay[dayKey].breakEnd = punch.timestamp;
        });

        const allDaysInRange: { day: string; punches: any }[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split('T')[0];
            allDaysInRange.push({ day: dayKey, punches: punchesByDay[dayKey] || {} });
        }
        
        return allDaysInRange.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());
    }, [timePunches, employee.id, startDate, endDate]);

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateDuration = (checkIn?: string, checkOut?: string, breakStart?: string, breakEnd?: string) => {
        if (!checkIn || !checkOut) return '-';
        let totalMillis = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        if (breakStart && breakEnd) {
            totalMillis -= (new Date(breakEnd).getTime() - new Date(breakStart).getTime());
        }
        if (totalMillis < 0) return 'Error';
        const hours = Math.floor(totalMillis / 3600000);
        const minutes = Math.floor((totalMillis % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="p-6">
            {!isSelfView && (
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-text-secondary hover:text-white mb-4">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back to Overview
                </button>
            )}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                    <img src={getAvatarUrl(employee.name, employee.avatar)} alt={employee.name} className="w-12 h-12 rounded-full" />
                    <div>
                        <h3 className="text-xl font-bold">{employee.name}'s Timesheet</h3>
                        <p className="text-text-secondary">{employee.jobTitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-primary p-2 rounded-lg">
                    <label className="text-sm font-semibold">From:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-secondary p-2 rounded-md border border-slate-600 [color-scheme:dark]" />
                    <label className="text-sm font-semibold">To:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-secondary p-2 rounded-md border border-slate-600 [color-scheme:dark]" />
                </div>
            </div>
            <div className="bg-primary rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-slate-700 text-text-secondary uppercase text-xs">
                            <tr>
                                <th className="p-3">Date</th><th className="p-3">Check-In</th><th className="p-3">Check-Out</th>
                                <th className="p-3">Break Start</th><th className="p-3">Break End</th><th className="p-3">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyPunches.map(({ day, punches }, index) => (
                                <tr key={day} className={`border-b border-border-color ${index % 2 !== 0 ? 'bg-secondary' : 'bg-primary'}`}>
                                    <td className="p-3 font-semibold text-text-primary">{new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
                                    <td className="p-3 text-text-primary">{formatTime(punches.checkIn)}</td>
                                    <td className="p-3 text-text-primary">{formatTime(punches.checkOut)}</td>
                                    <td className="p-3 text-text-primary">{formatTime(punches.breakStart)}</td>
                                    <td className="p-3 text-text-primary">{formatTime(punches.breakEnd)}</td>
                                    <td className="p-3 text-text-primary font-bold">{calculateDuration(punches.checkIn, punches.checkOut, punches.breakStart, punches.breakEnd)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Admin View Components ---
const AddEmployeeForm: React.FC<{ onEmployeeAdded: () => void }> = ({ onEmployeeAdded }) => {
    const { addEmployee, contacts } = useAppContext();
    const [formData, setFormData] = useState({
        name: '', email: '', jobTitle: '', startDate: '', 
        employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, 
        managerId: '', role: UserRole.Employee
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const managers = useMemo(() => contacts.filter(c => c.role === UserRole.Manager || c.role === UserRole.Admin), [contacts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!formData.name || !formData.email || !formData.startDate || !formData.jobTitle) {
            setError('Please fill out all required fields.');
            return;
        }
        try {
            addEmployee(formData);
            setSuccess(`Successfully added ${formData.name}.`);
            setFormData({
                name: '', email: '', jobTitle: '', startDate: '', 
                employeeType: EmployeeType.Fulltime, payType: PayType.Salaried, 
                managerId: '', role: UserRole.Employee
            });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    return (
        <div className="p-6 bg-primary rounded-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Add New Employee</h3>
            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-md mb-4">{error}</div>}
            {success && <div className="bg-green-500/10 text-green-400 p-3 rounded-md mb-4">{success}</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Job Title</label>
                    <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 [color-scheme:dark]" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Assign Manager</label>
                    <select name="managerId" value={formData.managerId} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight">
                        <option value="">Select Manager</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight">
                        {Object.values(UserRole).map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Contract Type</label>
                    <select name="employeeType" value={formData.employeeType} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight">
                        {Object.values(EmployeeType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Pay Type</label>
                    <select name="payType" value={formData.payType} onChange={handleChange} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-highlight">
                        {Object.values(PayType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2 text-right">
                    <button type="submit" className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-highlight">Add Employee</button>
                </div>
            </form>
        </div>
    );
};

const AllEmployeesTable: React.FC<{ onRowClick: (employee: User) => void }> = ({ onRowClick }) => {
    const { contacts, getContactById, timesheets, setTimesheetStatus, requestTimesheetApproval } = useAppContext();
    
    const calculateAnniversary = (startDate: string) => {
        const start = new Date(startDate);
        const today = new Date();
        let years = today.getFullYear() - start.getFullYear();
        if (today < new Date(today.getFullYear(), start.getMonth(), start.getDate())) {
            years--;
        }
        return years >= 1 ? `${years} year${years > 1 ? 's' : ''}` : 'First year';
    };

    const getStatus = (timesheet: Timesheet | undefined) => {
        if (!timesheet) return <span className="text-xs font-bold bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full">No Record</span>;
        switch (timesheet.status) {
            case TimesheetStatus.Approved: return <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Approved</span>;
            case TimesheetStatus.PendingApproval: return <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Pending Approval</span>;
            case TimesheetStatus.Pending: return <span className="text-xs font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Pending</span>;
        }
    };
    
    return (
        <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
                <thead>
                    <tr className="border-b border-border-color text-text-secondary">
                        <th className="p-3">Employee</th><th className="p-3">Manager</th><th className="p-3">Start Date</th>
                        <th className="p-3">Work Anniversary</th><th className="p-3">Timesheet Status</th><th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[...contacts].sort((a,b) => a.name.localeCompare(b.name)).map(employee => {
                        const timesheet = timesheets.find(ts => ts.employeeId === employee.id);
                        return (
                        <tr key={employee.id} onClick={() => onRowClick(employee)} className="border-b border-border-color hover:bg-btn-bg text-text-primary cursor-pointer">
                            <td className="p-3">
                                <div className="flex items-center space-x-3">
                                    <img src={getAvatarUrl(employee.name, employee.avatar)} alt={employee.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold">{employee.name}</p>
                                        <p className="text-xs text-text-secondary">{employee.jobTitle}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-3">{getContactById(employee.managerId || '')?.name || '-'}</td>
                            <td className="p-3">{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : '-'}</td>
                            <td className="p-3">{employee.startDate ? calculateAnniversary(employee.startDate) : '-'}</td>
                            <td className="p-3">{getStatus(timesheet)}</td>
                            <td className="p-3">
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => timesheet && requestTimesheetApproval(timesheet.id)} disabled={!timesheet || timesheet.status !== TimesheetStatus.Pending} className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed">Request</button>
                                    <button onClick={() => timesheet && setTimesheetStatus(timesheet.id, TimesheetStatus.Approved)} disabled={!timesheet || timesheet.status === TimesheetStatus.Approved} className="px-2 py-1 text-xs font-semibold rounded bg-green-600 hover:bg-green-500 disabled:bg-slate-500 disabled:cursor-not-allowed">Approve</button>
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    );
};

const PayrollHistoryView: React.FC = () => {
    const { payrollHistory, runPayrollForPeriod } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [period, setPeriod] = useState({ start: '', end: '' });

    const handleRunPayroll = () => {
        if (period.start && period.end) {
            runPayrollForPeriod(period);
            setShowModal(false);
        }
    };
    
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Payroll History</h3>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-highlight">Run New Payroll</button>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="bg-primary p-6 rounded-lg space-y-4" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold">Set Payroll Period</h4>
                        <div className="flex gap-4">
                            <div>
                                <label className="text-sm">Start Date</label>
                                <input type="date" value={period.start} onChange={e => setPeriod({...period, start: e.target.value})} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 [color-scheme:dark]" />
                            </div>
                            <div>
                                <label className="text-sm">End Date</label>
                                <input type="date" value={period.end} onChange={e => setPeriod({...period, end: e.target.value})} className="w-full bg-secondary p-2 rounded-lg border border-slate-600 [color-scheme:dark]" />
                            </div>
                        </div>
                        <div className="text-right">
                             <button onClick={handleRunPayroll} className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-highlight">Run</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-border-color text-text-secondary"><th className="p-3">Run Date</th><th className="p-3">Period</th><th className="p-3">Employees</th><th className="p-3">Total Amount</th></tr></thead>
                    <tbody>
                        {payrollHistory.map(run => (
                            <tr key={run.id} className="border-b border-border-color hover:bg-btn-bg text-text-primary">
                                <td className="p-3">{new Date(run.runDate).toLocaleString()}</td>
                                <td className="p-3">{new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}</td>
                                <td className="p-3">{run.employeeIds.length}</td>
                                <td className="p-3">${run.totalAmount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const AdminTimesheetView: React.FC<{ onEmployeeClick: (employee: User) => void }> = ({ onEmployeeClick }) => {
    const adminTabs = [
        { key: 'allEmployees', label: 'All Employees', icon: UsersIcon },
        { key: 'addEmployee', label: 'Add Employee', icon: UserPlusIcon },
        { key: 'payroll', label: 'Payroll', icon: CurrencyDollarIcon },
    ];
    const [activeAdminTab, setActiveAdminTab] = useState('allEmployees');

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex-shrink-0 flex border-b border-slate-700 mb-4">
                {adminTabs.map(tab => (
                    <TabButton key={tab.key} label={tab.label} icon={tab.icon} isActive={activeAdminTab === tab.key} onClick={() => setActiveAdminTab(tab.key)} />
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeAdminTab === 'allEmployees' && <AllEmployeesTable onRowClick={onEmployeeClick} />}
                {activeAdminTab === 'addEmployee' && <AddEmployeeForm onEmployeeAdded={() => setActiveAdminTab('allEmployees')} />}
                {activeAdminTab === 'payroll' && <PayrollHistoryView />}
            </div>
        </div>
    );
};


// --- Manager View Components ---
const EmployeeTableRow: React.FC<{ 
    employee: User, 
    timesheet: Timesheet | undefined,
    isSelected: boolean,
    onToggleSelect: (id: string) => void,
    onRowClick: (employee: User) => void
}> = ({ employee, timesheet, isSelected, onToggleSelect, onRowClick }) => {
    
    const getStatus = (timesheet: Timesheet | undefined) => {
        if (!timesheet) return <span className="text-xs font-bold bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full">No Record</span>;
        if (timesheet.isPayrollSent) return <span className="text-xs font-bold bg-success/20 text-success px-2 py-1 rounded-full">Sent</span>
        switch (timesheet.status) {
            case TimesheetStatus.Approved: return <div className="flex items-center space-x-2"><CheckIcon className="w-5 h-5 text-success" /><span className="text-sm text-text-secondary">by {timesheet.approvedBy}</span></div>;
            case TimesheetStatus.PendingApproval: return <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Pending Approval</span>;
            case TimesheetStatus.Pending: return <span className="text-xs font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Pending</span>;
        }
    };

    return (
        <tr onClick={() => onRowClick(employee)} className={`border-b border-border-color hover:bg-btn-bg cursor-pointer ${isSelected ? 'bg-btn-bg' : ''}`}>
            <td className="p-3" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(employee.id)} className="w-4 h-4 bg-secondary border-border-color rounded-sm text-highlight focus:ring-highlight" />
            </td>
            <td className="p-3">
                <div className="flex items-center space-x-3">
                    <img src={getAvatarUrl(employee.name, employee.avatar)} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <p className="font-semibold text-text-primary">{employee.name}</p>
                        <p className="text-sm text-text-secondary">{employee.jobTitle}</p>
                    </div>
                </div>
            </td>
            <td className="p-3 text-text-primary">
                <p>{employee.employeeType}</p>
                <p className="text-sm text-text-secondary">{employee.payType}</p>
            </td>
            <td className="p-3 text-text-primary">{timesheet?.regularHours || '-'}</td><td className="p-3 text-text-primary">{timesheet?.overtimeHours || '-'}</td>
            <td className="p-3 text-text-primary">{timesheet?.sickLeaveHours || '-'}</td><td className="p-3 text-text-primary">{timesheet?.ptoHours || '-'}</td>
            <td className="p-3 text-text-primary">{timesheet?.paidHolidayHours || '-'}</td><td className="p-3 text-text-primary font-bold">{timesheet?.totalHours || '-'}</td>
            <td className="p-3">{getStatus(timesheet)}</td>
        </tr>
    );
};

const ManagerTimesheetView: React.FC<{ onEmployeeClick: (employee: User) => void }> = ({ onEmployeeClick }) => {
    const { user, contacts, timesheets, sendToPayroll } = useAppContext();
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewFilter, setViewFilter] = useState<'team' | 'all'>('team');

    const employeesToDisplay = useMemo(() => {
        const source = viewFilter === 'team' ? contacts.filter(c => c.managerId === user.id) : contacts;
        return source.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [contacts, user.id, searchTerm, viewFilter]);

    const handleToggleSelect = (employeeId: string) => { setSelectedEmployeeIds(prev => prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]); };
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => { setSelectedEmployeeIds(event.target.checked ? employeesToDisplay.map(e => e.id) : []); };
    const handleSendToPayroll = () => {
        const timesheetIdsToSend = selectedEmployeeIds.map(empId => timesheets.find(t => t.employeeId === empId)?.id).filter((id): id is string => !!id);
        if(timesheetIdsToSend.length > 0) {
            sendToPayroll(timesheetIdsToSend);
            setSelectedEmployeeIds([]);
        } else {
            alert('No pending timesheets for selected employees.');
        }
    };
    
    return (
        <div className="p-4 rounded-lg flex-1 flex flex-col">
            <div className="flex justify-between items-center my-4 flex-wrap gap-4">
                <div className="relative w-full md:w-1/3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search employee" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-btn-bg pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight" />
                </div>
                 <div className="flex items-center bg-btn-bg p-1 rounded-lg">
                    <button onClick={() => setViewFilter('team')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewFilter === 'team' ? 'bg-btn-bg-alt text-btn-text-alt' : ''}`}>My Team</button>
                    <button onClick={() => setViewFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewFilter === 'all' ? 'bg-btn-bg-alt text-btn-text-alt' : ''}`}>All Employees</button>
                </div>
                <button onClick={handleSendToPayroll} disabled={selectedEmployeeIds.length === 0} className="flex items-center space-x-2 text-sm px-4 py-2 rounded-md bg-payroll-btn-bg text-payroll-btn-text font-bold hover:opacity-90 disabled:bg-slate-600 disabled:text-text-secondary disabled:cursor-not-allowed">
                    <ExclamationTriangleIcon className="w-5 h-5" /><span>Send To Payroll</span>
                </button>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm min-w-[1000px]">
                    <thead className="sticky top-0 bg-secondary">
                        <tr className="border-b border-border-color text-text-secondary">
                            <th className="p-3 w-12"><input type="checkbox" onChange={handleSelectAll} checked={employeesToDisplay.length > 0 && selectedEmployeeIds.length === employeesToDisplay.length} className="w-4 h-4 bg-secondary border-border-color rounded-sm text-highlight focus:ring-highlight" /></th>
                            <th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Regular</th><th className="p-3">Overtime</th><th className="p-3">Sick Leave</th><th className="p-3">PTO</th><th className="p-3">Paid Holiday</th><th className="p-3">Total hour</th><th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesToDisplay.map(emp => (
                            <EmployeeTableRow key={emp.id} employee={emp} timesheet={timesheets.find(ts => ts.employeeId === emp.id)} isSelected={selectedEmployeeIds.includes(emp.id)} onToggleSelect={handleToggleSelect} onRowClick={onEmployeeClick}/>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Employee View Components ---
const EmployeeTimesheetView: React.FC = () => {
    const { user, contacts, timePunches, requestLeave } = useAppContext();
    const [isPunchedIn, setIsPunchedIn] = useState(() => {
        const lastPunch = timePunches.filter(p => p.userId === user.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return lastPunch?.type === 'in';
    });

    const handlePunch = () => {
        setIsPunchedIn(prev => !prev);
        alert(`You have successfully punched ${!isPunchedIn ? 'in' : 'out'}.`);
    }
    
    const handleRequestLeave = () => {
      const leave: Omit<LeaveRequest, 'id' | 'status' | 'employeeId'> = { leaveType: 'PTO', startDate: '2024-08-20', endDate: '2024-08-22', reason: 'Personal Time Off' };
      requestLeave(leave);
      alert('Leave request for PTO from Aug 20 to Aug 22 has been submitted.');
    };

    const teamMembers = useMemo(() => contacts.filter(c => c.managerId === user.managerId && c.id !== user.id), [contacts, user.managerId, user.id]);
    const isCheckedIn = (userId: string) => {
        const lastPunch = timePunches.filter(p => p.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return lastPunch?.type === 'in';
    };
    const checkedInMembers = useMemo(() => teamMembers.filter(m => isCheckedIn(m.id)), [teamMembers, isCheckedIn]);
    const notCheckedInMembers = useMemo(() => teamMembers.filter(m => !isCheckedIn(m.id)), [teamMembers, isCheckedIn]);

    return (
        <div className="p-4 space-y-6">
            <div className="bg-primary p-6 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h3>
                    <p className="text-text-secondary">Ready to start your day?</p>
                </div>
                <button onClick={handlePunch} className={`px-8 py-3 text-lg font-bold rounded-lg transition-colors ${isPunchedIn ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                    {isPunchedIn ? 'Punch Out' : 'Punch In'}
                </button>
            </div>
            <div className="bg-primary p-6 rounded-lg">
                <h4 className="font-bold mb-4">Leave Management</h4>
                <div className="flex space-x-4">
                    <button onClick={handleRequestLeave} className="flex-1 p-4 bg-secondary rounded-lg hover:bg-slate-700 text-center font-semibold">Request Time Off</button>
                    <div className="flex-1 p-4 bg-secondary rounded-lg">
                        <p className="font-semibold">Leave Balances</p>
                        <div className="mt-2 text-sm text-text-secondary"><p>PTO: 10 days remaining</p><p>Sick Leave: 5 days remaining</p></div>
                    </div>
                </div>
            </div>
            <div className="bg-primary p-6 rounded-lg">
                <h4 className="font-bold mb-4">Team Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="font-semibold text-green-400 mb-2">Checked In ({checkedInMembers.length})</h5>
                        <ul className="space-y-2">{checkedInMembers.map(m => <li key={m.id} className="flex items-center space-x-2"><CheckCircleIcon className="w-5 h-5 text-green-400" /><span>{m.name}</span></li>)}</ul>
                    </div>
                     <div>
                        <h5 className="font-semibold text-slate-400 mb-2">Not Checked In ({notCheckedInMembers.length})</h5>
                        <ul className="space-y-2">{notCheckedInMembers.map(m => <li key={m.id} className="flex items-center space-x-2"><UserCircleIcon className="w-5 h-5 text-slate-500" /><span>{m.name}</span></li>)}</ul>
                    </div>
                </div>
            </div>
             <EmployeeDetailTimesheetView employee={user} onBack={() => {}} isSelfView={true} />
        </div>
    );
};

// --- Main View ---
export const TimesheetView: React.FC = () => {
    const { user } = useAppContext();
    const [currentViewRole, setCurrentViewRole] = useState(user.role || UserRole.Employee);
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

    const canBeManager = useMemo(() => user.role === UserRole.Manager || user.role === UserRole.Admin, [user.role]);
    const canBeAdmin = useMemo(() => user.role === UserRole.Admin, [user.role]);

    const tabs = [
        { key: 'timesheet', label: 'Timesheet', icon: ClockIcon },
        { key: 'schedule', label: 'Schedule', icon: CalendarDaysIcon },
        { key: 'approvals', label: 'Approvals', icon: DocumentTextIcon },
        { key: 'settings', label: 'Settings', icon: CogIcon },
    ];
    const [activeTab, setActiveTab] = useState('timesheet');
    
    const handleEmployeeClick = (employee: User) => {
        setSelectedEmployee(employee);
    };

    if (selectedEmployee) {
        return <EmployeeDetailTimesheetView employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
    }

    const RoleSwitcher = () => (
        <div className="flex items-center bg-btn-bg p-1 rounded-lg">
            {canBeAdmin && <button onClick={() => setCurrentViewRole(UserRole.Admin)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentViewRole === UserRole.Admin ? 'bg-btn-bg-alt text-btn-text-alt shadow' : 'text-text-primary'}`}>Admin</button>}
            {canBeManager && <button onClick={() => setCurrentViewRole(UserRole.Manager)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentViewRole === UserRole.Manager ? 'bg-btn-bg-alt text-btn-text-alt shadow' : 'text-text-primary'}`}>Manager</button>}
            <button onClick={() => setCurrentViewRole(UserRole.Employee)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentViewRole === UserRole.Employee ? 'bg-btn-bg-alt text-btn-text-alt shadow' : 'text-text-primary'}`}>Employee</button>
        </div>
    );
    
    const renderView = () => {
        switch(currentViewRole) {
            case UserRole.Admin: return <AdminTimesheetView onEmployeeClick={handleEmployeeClick} />;
            case UserRole.Manager: return <ManagerTimesheetView onEmployeeClick={handleEmployeeClick} />;
            case UserRole.Employee:
            default: return <EmployeeTimesheetView />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-secondary text-text-primary">
            <header className="flex items-center justify-between p-4 border-b border-slate-700 h-auto md:h-[77px] flex-shrink-0 bg-primary flex-wrap gap-4">
                <div className="flex items-center space-x-4 flex-wrap">
                    {tabs.map(tab => (
                        <TabButton key={tab.key} label={tab.label} icon={tab.icon} isActive={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
                    ))}
                </div>
                {(canBeAdmin || canBeManager) && <RoleSwitcher />}
            </header>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'timesheet' ? renderView() : <div className="p-8 text-center text-text-secondary">This section is not yet implemented.</div>}
            </div>
        </div>
    );
};