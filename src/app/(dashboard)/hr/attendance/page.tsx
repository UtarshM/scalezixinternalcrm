'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  getAttendanceRecords,
  getTodayAttendanceForUser,
  clockIn,
  clockOut,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  getEmployees,
  getAllUsersWithEmployees,
  getMonthlyAttendanceRecords,
  quickSetAttendanceStatus,
  markBulkUnmarkedAbsent,
} from '@/actions/hr'
import { useAuth } from '@/components/providers/auth-provider'
import { formatDate } from '@/lib/utils'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Calendar as CalendarIcon,
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  Edit3,
  Play,
  Square,
  Users,
  Filter,
  RefreshCw,
  Download,
  Check,
  UserCheck,
  Building,
  FileSpreadsheet,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import type { AttendanceRecord, Employee, User } from '@/types'

export default function AttendancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // Tab mode: 'roster' | 'logs' | 'monthly'
  const [activeTab, setActiveTab] = React.useState<'roster' | 'logs' | 'monthly'>('roster')

  // Data states
  const [records, setRecords] = React.useState<AttendanceRecord[]>([])
  const [allUsers, setAllUsers] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [todayRecord, setTodayRecord] = React.useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Clock in/out state
  const [clockNotes, setClockNotes] = React.useState('')
  const [clocking, setClocking] = React.useState(false)

  // Filters & Date selectors
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = React.useState('all')
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [monthlyRecords, setMonthlyRecords] = React.useState<AttendanceRecord[]>([])

  // Modal State for Manual Entry / Editing
  const [showModal, setShowModal] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState<AttendanceRecord | null>(null)
  const [formUserId, setFormUserId] = React.useState('')
  const [formDate, setFormDate] = React.useState(new Date().toISOString().split('T')[0])
  const [formCheckIn, setFormCheckIn] = React.useState('')
  const [formCheckOut, setFormCheckOut] = React.useState('')
  const [formStatus, setFormStatus] = React.useState<'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'remote'>('present')
  const [formNotes, setFormNotes] = React.useState('')

  // Real-time clock
  const [currentTime, setCurrentTime] = React.useState<string>('')

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [attData, empData, usersData, myToday, monthData] = await Promise.all([
        getAttendanceRecords(selectedDate || undefined),
        getEmployees(),
        getAllUsersWithEmployees(),
        getTodayAttendanceForUser(),
        getMonthlyAttendanceRecords(selectedMonth),
      ])
      setRecords(attData as any)
      setEmployees(empData)
      setAllUsers(usersData)
      setTodayRecord(myToday as any)
      setMonthlyRecords(monthData as any)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, selectedMonth])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClockIn = async () => {
    setClocking(true)
    try {
      await clockIn(clockNotes)
      toast.success('Successfully Clocked In!')
      setClockNotes('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to clock in')
    } finally {
      setClocking(false)
    }
  }

  const handleClockOut = async () => {
    setClocking(true)
    try {
      await clockOut(clockNotes)
      toast.success('Successfully Clocked Out!')
      setClockNotes('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to clock out')
    } finally {
      setClocking(false)
    }
  }

  const handleQuickStatusChange = async (userId: string, status: any) => {
    try {
      await quickSetAttendanceStatus(userId, selectedDate, status)
      toast.success(`Updated status to ${status.replace('_', ' ')}`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  const handleAutoMarkAbsent = async () => {
    if (!confirm(`Mark all unmarked employees as ABSENT for ${selectedDate}?`)) return
    try {
      const count = await markBulkUnmarkedAbsent(selectedDate)
      toast.success(`Marked ${count || 0} unmarked employees as Absent`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-mark absent')
    }
  }

  const handleOpenAddModal = (defaultUserId?: string) => {
    setEditingRecord(null)
    setFormUserId(defaultUserId || user?.id || (allUsers[0]?.id || ''))
    setFormDate(selectedDate || new Date().toISOString().split('T')[0])
    setFormCheckIn('09:00')
    setFormCheckOut('18:00')
    setFormStatus('present')
    setFormNotes('')
    setShowModal(true)
  }

  const handleOpenEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec)
    setFormUserId(rec.user_id)
    setFormDate(rec.date)
    setFormCheckIn(rec.check_in ? new Date(rec.check_in).toISOString().slice(11, 16) : '')
    setFormCheckOut(rec.check_out ? new Date(rec.check_out).toISOString().slice(11, 16) : '')
    setFormStatus(rec.status)
    setFormNotes(rec.notes || '')
    setShowModal(true)
  }

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formUserId || !formDate) return
    try {
      let checkInIso: string | null = null
      let checkOutIso: string | null = null

      if (formCheckIn) {
        checkInIso = new Date(`${formDate}T${formCheckIn}:00`).toISOString()
      }
      if (formCheckOut) {
        checkOutIso = new Date(`${formDate}T${formCheckOut}:00`).toISOString()
      }

      await saveAttendanceRecord({
        id: editingRecord?.id,
        user_id: formUserId,
        employee_id: employees.find(e => e.user_id === formUserId)?.id || null,
        date: formDate,
        check_in: checkInIso,
        check_out: checkOutIso,
        status: formStatus,
        notes: formNotes,
      })

      toast.success(editingRecord ? 'Attendance updated' : 'Attendance record created')
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save record')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return
    try {
      await deleteAttendanceRecord(id)
      toast.success('Record deleted')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const exportToCSV = () => {
    const listToExport = activeTab === 'monthly' ? monthlyRecords : filteredRecords
    if (listToExport.length === 0) {
      toast.error('No attendance records to export')
      return
    }

    const headers = ['Employee Name', 'Email', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Notes']
    const rows = listToExport.map(r => [
      `"${r.user?.full_name || ''}"`,
      `"${r.user?.email || ''}"`,
      r.date,
      r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      r.total_hours || 0,
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_Report_${selectedDate || selectedMonth}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Attendance CSV exported successfully')
  }

  // Filtered records for Logs view
  const filteredRecords = records.filter(r => {
    const userName = r.user?.full_name?.toLowerCase() || ''
    const userEmail = r.user?.email?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    const matchesSearch = userName.includes(query) || userEmail.includes(query)
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Statistics calculation for selected date
  const totalEmployeeCount = allUsers.length
  const attendanceMapByUserId = new Map<string, AttendanceRecord>()
  records.forEach(r => {
    if (r.date === selectedDate) {
      attendanceMapByUserId.set(r.user_id, r)
    }
  })

  const dayPresentCount = Array.from(attendanceMapByUserId.values()).filter(r => r.status === 'present' || r.status === 'late').length
  const dayLateCount = Array.from(attendanceMapByUserId.values()).filter(r => r.status === 'late').length
  const dayRemoteCount = Array.from(attendanceMapByUserId.values()).filter(r => r.status === 'remote').length
  const dayAbsentCount = Array.from(attendanceMapByUserId.values()).filter(r => r.status === 'absent' || r.status === 'on_leave').length
  const dayUnmarkedCount = Math.max(0, totalEmployeeCount - attendanceMapByUserId.size)

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Monthly Matrix Days calculation
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number)
  const daysInMonth = yearNum && monthNum ? new Date(yearNum, monthNum, 0).getDate() : 31
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/hr"
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to HR
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Attendance Tracker</h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
                Admin Control Active
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {isAdmin
              ? 'Track employee daily check-ins, view roster status, and generate monthly attendance logs.'
              : 'Clock in/out daily, track working hours, and view team attendance.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--secondary)] rounded-lg border border-[var(--border)] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--card)] transition-all"
            title="Export CSV"
          >
            <Download size={14} />
            Export CSV
          </button>

          {isAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <Plus size={16} />
              Log Attendance
            </button>
          )}
        </div>
      </div>

      {/* Live Clock In / Clock Out Card */}
      <div className="bg-gradient-to-r from-[var(--card)] via-[var(--secondary)]/40 to-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                My Shift Attendance
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-mono tracking-tight">
              {currentTime || '--:--:--'}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Optional note / task..."
              value={clockNotes}
              onChange={e => setClockNotes(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none w-full sm:w-64"
            />

            {!todayRecord?.check_in ? (
              <button
                onClick={handleClockIn}
                disabled={clocking}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Play size={16} />
                {clocking ? 'Clocking In...' : 'Clock In Now'}
              </button>
            ) : !todayRecord?.check_out ? (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Clocked In at {formatTime(todayRecord.check_in)}
                  </div>
                  <div className="text-[var(--muted-foreground)] capitalize">Status: {todayRecord.status}</div>
                </div>
                <button
                  onClick={handleClockOut}
                  disabled={clocking}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Square size={16} />
                  {clocking ? 'Clocking Out...' : 'Clock Out'}
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs text-emerald-500 font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <div>
                  <div>Shift Completed Today</div>
                  <div className="font-normal opacity-80">
                    {formatTime(todayRecord.check_in)} - {formatTime(todayRecord.check_out)} ({todayRecord.total_hours || 0} hrs)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Stats Summary Grid (Clickable Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('all')
            if (activeTab === 'monthly') setActiveTab('roster')
          }}
          className={`bg-[var(--card)] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md ${
            selectedStatus === 'all'
              ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--secondary)]/40'
              : 'border-[var(--border)] hover:border-[var(--accent)]/60'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{totalEmployeeCount}</div>
            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 font-medium">
              Total Staff
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus('present')
            if (activeTab === 'monthly') setActiveTab('roster')
          }}
          className={`bg-[var(--card)] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md ${
            selectedStatus === 'present'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5'
              : 'border-[var(--border)] hover:border-emerald-500/60'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{dayPresentCount}</div>
            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 font-medium">
              Present
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus('late')
            if (activeTab === 'monthly') setActiveTab('roster')
          }}
          className={`bg-[var(--card)] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md ${
            selectedStatus === 'late'
              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
              : 'border-[var(--border)] hover:border-amber-500/60'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{dayLateCount}</div>
            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 font-medium">
              Late Arrivals
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus('remote')
            if (activeTab === 'monthly') setActiveTab('roster')
          }}
          className={`bg-[var(--card)] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md ${
            selectedStatus === 'remote'
              ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5'
              : 'border-[var(--border)] hover:border-blue-500/60'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Building size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{dayRemoteCount}</div>
            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 font-medium">
              Remote
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus(selectedStatus === 'absent' ? 'all' : 'absent')
            if (activeTab === 'monthly') setActiveTab('roster')
          }}
          className={`bg-[var(--card)] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md ${
            selectedStatus === 'absent' || selectedStatus === 'on_leave'
              ? 'border-red-500 ring-2 ring-red-500/30 bg-red-500/5'
              : 'border-[var(--border)] hover:border-red-500/60'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--foreground)]">{dayAbsentCount}</div>
            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 font-medium">
              Absent / Leave
            </div>
          </div>
        </button>
      </div>


      {/* Tabs & Date Selector Navigation Bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2 bg-[var(--secondary)] p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'roster'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <UserCheck size={14} />
              Daily Employee Roster
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <FileSpreadsheet size={14} />
              Monthly Attendance Sheet
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Clock size={14} />
              Detailed Logs Table
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'monthly' ? (
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Select Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Selected Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-xs text-[var(--accent)] hover:underline font-semibold"
                >
                  Today
                </button>
              </div>
            )}

            {isAdmin && activeTab === 'roster' && (
              <button
                onClick={handleAutoMarkAbsent}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                title="Mark all employees without check-in as Absent"
              >
                <Zap size={13} />
                Auto-Mark Absent ({dayUnmarkedCount})
              </button>
            )}
          </div>
        </div>

        {/* Search & Status Filters for Roster / Logs */}
        {activeTab !== 'monthly' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-[var(--muted-foreground)]" size={15} />
              <input
                type="text"
                placeholder="Search employee by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter size={14} className="text-[var(--muted-foreground)]" />
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="remote">Remote</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
                <option value="absent">Absent</option>
                <option value="unmarked">Unmarked</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: DAILY EMPLOYEE ROSTER MATRIX */}
      {activeTab === 'roster' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--secondary)]/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              Daily Attendance Roster for {formatDate(selectedDate)}
            </h3>
            <span className="text-xs text-[var(--muted-foreground)]">
              Showing {allUsers.length} total employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs uppercase font-semibold tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Hours Logged</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allUsers
                  .filter(u => {
                    const q = searchQuery.toLowerCase()
                    const matchesName = (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                    const att = attendanceMapByUserId.get(u.id)
                    const matchesStat =
                      selectedStatus === 'all'
                        ? true
                        : selectedStatus === 'unmarked'
                        ? !att
                        : att?.status === selectedStatus
                    return matchesName && matchesStat
                  })
                  .map(usr => {
                    const att = attendanceMapByUserId.get(usr.id)
                    const emp = usr.employee

                    return (
                      <tr key={usr.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold flex items-center justify-center text-xs">
                              {(usr.full_name || usr.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--foreground)]">{usr.full_name || 'Unnamed User'}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{usr.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-[var(--muted-foreground)]">
                          {emp?.designation || emp?.department || usr.role || 'Staff'}
                        </td>

                        <td className="p-4">
                          {isAdmin ? (
                            <select
                              value={att?.status || 'unmarked'}
                              onChange={e => {
                                if (e.target.value !== 'unmarked') {
                                  handleQuickStatusChange(usr.id, e.target.value as any)
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none transition-all appearance-none pr-6 bg-no-repeat bg-[right_8px_center] ${
                                att?.status === 'present'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : att?.status === 'late'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                  : att?.status === 'remote'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
                                  : att?.status === 'half_day'
                                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20'
                                  : att?.status === 'absent'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                  : att?.status === 'on_leave'
                                  ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                              }`}
                            >
                              <option value="unmarked" className="bg-[var(--card)] text-[var(--foreground)]">Not Clocked In ▾</option>
                              <option value="present" className="bg-[var(--card)] text-emerald-500">Present ▾</option>
                              <option value="late" className="bg-[var(--card)] text-amber-500">Late ▾</option>
                              <option value="remote" className="bg-[var(--card)] text-blue-500">Remote ▾</option>
                              <option value="half_day" className="bg-[var(--card)] text-purple-500">Half Day ▾</option>
                              <option value="on_leave" className="bg-[var(--card)] text-orange-500">On Leave ▾</option>
                              <option value="absent" className="bg-[var(--card)] text-red-500">Absent ▾</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                                att?.status === 'present'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : att?.status === 'late'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : att?.status === 'remote'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  : att?.status === 'half_day'
                                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                  : att?.status === 'absent'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }`}
                            >
                              {att?.status ? att.status.replace('_', ' ') : 'Not Clocked In'}
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono text-xs text-[var(--foreground)]">
                          {formatTime(att?.check_in)}
                        </td>

                        <td className="p-4 font-mono text-xs text-[var(--foreground)]">
                          {formatTime(att?.check_out)}
                        </td>

                        <td className="p-4 font-mono text-xs text-[var(--foreground)]">
                          {att?.total_hours ? `${att.total_hours} hrs` : '--'}
                        </td>

                        {isAdmin && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => (att ? handleOpenEditModal(att) : handleOpenAddModal(usr.id))}
                              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:bg-[var(--secondary)] rounded-lg transition-all"
                              title="Edit check-in/out times & details"
                            >
                              <Edit3 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY ATTENDANCE SHEET */}
      {activeTab === 'monthly' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--secondary)]/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Monthly Attendance Sheet ({selectedMonth})
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Legend: <span className="text-emerald-500 font-bold">P</span> = Present,{' '}
                <span className="text-amber-500 font-bold">L</span> = Late,{' '}
                <span className="text-blue-500 font-bold">R</span> = Remote,{' '}
                <span className="text-purple-500 font-bold">HD</span> = Half Day,{' '}
                <span className="text-red-500 font-bold">A</span> = Absent,{' '}
                <span className="text-orange-500 font-bold">OL</span> = On Leave
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90"
            >
              <Download size={13} />
              Export Sheet
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 font-semibold text-[var(--muted-foreground)]">
                  <th className="p-3 sticky left-0 bg-[var(--card)] z-10 shadow-sm border-r border-[var(--border)] min-w-[160px]">
                    Employee
                  </th>
                  {daysArray.map(d => (
                    <th key={d} className="p-1.5 text-center min-w-[28px]">
                      {d}
                    </th>
                  ))}
                  <th className="p-3 text-center border-l border-[var(--border)] bg-[var(--secondary)]/30">Totals (P/A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allUsers.map(usr => {
                  let userPresentDays = 0
                  let userAbsentDays = 0

                  return (
                    <tr key={usr.id} className="hover:bg-[var(--secondary)]/20">
                      <td className="p-3 font-semibold text-[var(--foreground)] sticky left-0 bg-[var(--card)] z-10 border-r border-[var(--border)] truncate max-w-[160px]">
                        {usr.full_name || usr.email}
                      </td>

                      {daysArray.map(dayNum => {
                        const dateStr = `${selectedMonth}-${String(dayNum).padStart(2, '0')}`
                        const att = monthlyRecords.find(r => r.user_id === usr.id && r.date === dateStr)

                        let badge = '-'
                        let colorClass = 'text-[var(--muted-foreground)] opacity-40'

                        if (att) {
                          if (att.status === 'present') {
                            badge = 'P'
                            colorClass = 'bg-emerald-500/20 text-emerald-500 font-bold'
                            userPresentDays++
                          } else if (att.status === 'late') {
                            badge = 'L'
                            colorClass = 'bg-amber-500/20 text-amber-500 font-bold'
                            userPresentDays++
                          } else if (att.status === 'remote') {
                            badge = 'R'
                            colorClass = 'bg-blue-500/20 text-blue-500 font-bold'
                            userPresentDays++
                          } else if (att.status === 'half_day') {
                            badge = 'HD'
                            colorClass = 'bg-purple-500/20 text-purple-500 font-bold'
                            userPresentDays += 0.5
                          } else if (att.status === 'absent') {
                            badge = 'A'
                            colorClass = 'bg-red-500/20 text-red-500 font-bold'
                            userAbsentDays++
                          } else if (att.status === 'on_leave') {
                            badge = 'OL'
                            colorClass = 'bg-orange-500/20 text-orange-500 font-bold'
                          }
                        }

                        return (
                          <td key={dayNum} className="p-1 text-center font-mono">
                            <span className={`inline-block w-6 h-6 leading-6 text-[10px] rounded ${colorClass}`}>
                              {badge}
                            </span>
                          </td>
                        )
                      })}

                      <td className="p-3 text-center font-bold border-l border-[var(--border)] bg-[var(--secondary)]/20">
                        <span className="text-emerald-500">{userPresentDays}d P</span> /{' '}
                        <span className="text-red-500">{userAbsentDays}d A</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DETAILED ATTENDANCE LOGS TABLE */}
      {activeTab === 'logs' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--secondary)]/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Attendance Log History</h3>
            <span className="text-xs text-[var(--muted-foreground)]">Showing {filteredRecords.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs uppercase font-semibold tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Hours Logged</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notes</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[var(--foreground)]">{record.user?.full_name || 'User'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{record.user?.email}</div>
                    </td>
                    <td className="p-4 text-[var(--foreground)]">{formatDate(record.date)}</td>
                    <td className="p-4 font-mono text-xs text-[var(--foreground)]">{formatTime(record.check_in)}</td>
                    <td className="p-4 font-mono text-xs text-[var(--foreground)]">{formatTime(record.check_out)}</td>
                    <td className="p-4 font-mono text-xs text-[var(--foreground)]">
                      {record.total_hours ? `${record.total_hours} hrs` : '--'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          record.status === 'present'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : record.status === 'late'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : record.status === 'remote'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : record.status === 'half_day'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[var(--muted-foreground)] max-w-xs truncate" title={record.notes || ''}>
                      {record.notes || '-'}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1 text-red-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {editingRecord ? 'Edit Attendance Record' : 'Manual Attendance Entry'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Select Employee</label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  disabled={!!editingRecord}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  {allUsers.map(usr => (
                    <option key={usr.id} value={usr.id}>
                      {usr.full_name || usr.email} ({usr.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="remote">Remote</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Check In Time</label>
                  <input
                    type="time"
                    value={formCheckIn}
                    onChange={e => setFormCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Check Out Time</label>
                  <input
                    type="time"
                    value={formCheckOut}
                    onChange={e => setFormCheckOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Notes / Reason</label>
                <textarea
                  placeholder="Optional notes..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
