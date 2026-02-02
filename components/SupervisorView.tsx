
import React, { useState, useEffect, useMemo } from 'react';
import { AbsenceRecord } from '../types';
import { exportToExcel } from '../services/excelService';
import { getAttendanceInsights } from '../services/geminiService';
import { 
  Download, 
  Search, 
  UserX, 
  MessageCircle, 
  Sparkles, 
  Loader2, 
  ClipboardList, 
  FileText, 
  AlertCircle, 
  X,
  Trash2,
  RefreshCw,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface SupervisorViewProps {
  records: AbsenceRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

const SupervisorView: React.FC<SupervisorViewProps> = ({ records, onDeleteRecord, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRecordCount, setLastRecordCount] = useState(records.length);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Calculate cumulative absences for each student to determine color coding
  const studentStats = useMemo(() => {
    const stats: Record<string, number> = {};
    records.forEach(r => {
      if (r.reason === 'absent') {
        stats[r.studentName] = (stats[r.studentName] || 0) + 1;
      }
    });
    return stats;
  }, [records]);

  const getAbsenceStyle = (studentName: string) => {
    const count = studentStats[studentName] || 0;
    
    if (count >= 32) return { 
      bg: 'bg-purple-50', 
      text: 'text-purple-800', 
      border: 'border-purple-200', 
      badge: 'bg-purple-600',
      label: 'خطير جداً (32+)' 
    };
    if (count >= 16) return { 
      bg: 'bg-red-50', 
      text: 'text-red-800', 
      border: 'border-red-200', 
      badge: 'bg-red-600',
      label: 'إنذار نهائي (16+)' 
    };
    if (count >= 7) return { 
      bg: 'bg-orange-50', 
      text: 'text-orange-800', 
      border: 'border-orange-200', 
      badge: 'bg-orange-500',
      label: 'تجاوز الأسبوع (7+)' 
    };
    if (count >= 3) return { 
      bg: 'bg-yellow-50', 
      text: 'text-yellow-800', 
      border: 'border-yellow-200', 
      badge: 'bg-yellow-500',
      label: 'تنبيه أول (3+)' 
    };
    
    return { 
      bg: 'bg-white', 
      text: 'text-slate-700', 
      border: 'border-slate-100', 
      badge: 'bg-slate-400',
      label: '' 
    };
  };

  useEffect(() => {
    if (records.length > 0 && Math.abs(records.length - lastRecordCount) > 2) {
      handleAnalyze();
    } else if (records.length === 0) {
      setInsights([]);
    }

    if (records.length > lastRecordCount && lastRecordCount !== 0) {
      setShowUpdateToast(true);
      const timer = setTimeout(() => setShowUpdateToast(false), 5000);
      setLastRecordCount(records.length);
      return () => clearTimeout(timer);
    }
    setLastRecordCount(records.length);
  }, [records.length]);

  const handleAnalyze = async () => {
    if (records.length === 0) return;
    setIsAnalyzing(true);
    const result = await getAttendanceInsights(records);
    setInsights(result.insights || []);
    setIsAnalyzing(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return;
    const exportData = filteredRecords.map(r => ({
      'تاريخ التقرير': format(new Date(r.date), 'yyyy-MM-dd HH:mm'),
      'الأستاذ': r.teacherName,
      'اسم التلميذ': r.studentName,
      'إجمالي الغيابات': studentStats[r.studentName] || 0,
      'الحالة': r.reason === 'absent' ? 'غائب' : 'متأخر',
      'ملاحظة الجلسة': r.messageToSupervisor || 'لا توجد'
    }));
    exportToExcel(exportData, `متابعة_الغياب_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportText = () => {
    const absentStudents = filteredRecords
      .filter(r => r.reason === 'absent')
      .map(r => `${r.studentName} (${studentStats[r.studentName]} غيابات)`);

    if (absentStudents.length === 0) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const content = `قائمة التلاميذ الغائبين - رقمنة الغيابات - ${dateStr}\n` + 
                    `===================================\n\n` + 
                    absentStudents.map((name, index) => `${index + 1}. ${name}`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_الغياب_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      
      {/* Real-time Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-700 text-white rounded-2xl shadow-xl border-b-4 border-blue-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping absolute" />
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full relative shadow-[0_0_12px_rgba(74,222,128,1)]" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">المزامنة السحابية فعالة</span>
          </div>
          {/* Refresh button removed per user request */}
        </div>

        {showUpdateToast && (
          <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 animate-bounce" />
              <p className="text-sm font-black">تنبيه: وصل تقرير غياب جديد الآن!</p>
            </div>
            <button onClick={() => setShowUpdateToast(false)} className="p-1.5"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Threshold Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-xs font-black text-slate-400 uppercase w-full mb-1">دليل العقوبات والغياب:</div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" /> 3+ أيام
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-orange-500 rounded-full" /> 7+ أيام
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-red-600 rounded-full" /> 16+ يوماً
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 text-[10px] font-black">
          <div className="w-2 h-2 bg-purple-600 rounded-full" /> 32+ يوماً
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث عن تلميذ..."
              className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={handleExportText} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black"><FileText className="w-4 h-4" /> نص</button>
            <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black"><Download className="w-4 h-4" /> إكسل</button>
            <button onClick={onClearAll} className="flex-1 md:flex-none p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-red-100"><Trash2 className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">اسم التلميذ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي الغيابات</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">الأستاذ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, idx) => {
                const style = getAbsenceStyle(record.studentName);
                const count = studentStats[record.studentName] || 0;
                
                return (
                  <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors ${style.bg}`}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`font-black text-sm ${style.text}`}>{record.studentName}</span>
                        {style.label && (
                          <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${style.text}`}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {style.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-xs ${style.badge} shadow-sm`}>
                        {count}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">{record.teacherName}</td>
                    <td className="px-6 py-5 text-[11px] font-black text-slate-400 tabular-nums">
                      {format(new Date(record.date), 'HH:mm - dd/MM')}
                    </td>
                    <td className="px-6 py-5 flex items-center justify-center gap-3">
                      {record.messageToSupervisor && (
                        <div className="relative group/tooltip">
                          <MessageCircle className="w-5 h-5 text-blue-300 group-hover:text-blue-600 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 z-50 pointer-events-none shadow-2xl leading-relaxed">
                            {record.messageToSupervisor}
                          </div>
                        </div>
                      )}
                      <button onClick={() => onDeleteRecord(record.id)} className="p-1.5 text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorView;
