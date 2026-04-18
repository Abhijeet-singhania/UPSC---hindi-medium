import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CalendarRange, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const PastYearProblems = () => {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState({ years: [], subjects: [], papers: [], exam_types: [] });
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);

  const {
    data: filterData,
    isLoading: isLoadingFilters,
    error: filtersError,
    execute: loadFilters,
  } = useApi(`${API_BASE_URL}/api/v1/past-year-problems/filters`);

  const {
    data: problemsData,
    isLoading: isLoadingProblems,
    error: problemsError,
    execute: loadProblems,
  } = useApi(`${API_BASE_URL}/api/v1/past-year-problems/`);

  const language = useMemo(() => (i18n.language === 'en' ? 'en' : 'hi'), [i18n.language]);

  useEffect(() => {
    loadFilters({ queryParams: { language } }).catch(() => {});
  }, [language, loadFilters]);

  useEffect(() => {
    if (filterData) {
      setFilters(filterData);
    }
  }, [filterData]);

  useEffect(() => {
    loadProblems({
      queryParams: {
        language,
        year: selectedYear || undefined,
        exam_type: selectedExamType || undefined,
        subject: selectedSubject || undefined,
        paper: selectedPaper || undefined,
        search: searchInput || undefined,
        limit: 50,
      },
    }).catch(() => {});
  }, [language, selectedYear, selectedExamType, selectedSubject, selectedPaper, searchInput, loadProblems]);

  useEffect(() => {
    if (Array.isArray(problemsData) && problemsData.length > 0) {
      if (!selectedProblem || !problemsData.find((item) => item.id === selectedProblem.id)) {
        setSelectedProblem(problemsData[0]);
      }
    } else {
      setSelectedProblem(null);
    }
  }, [problemsData, selectedProblem]);

  const resetFilters = () => {
    setSelectedYear('');
    setSelectedExamType('');
    setSelectedSubject('');
    setSelectedPaper('');
    setSearchInput('');
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h2 className="font-serif text-[28px] font-semibold text-[#201E1C] mb-1">{t('pastYearProblems.title')}</h2>
        <p className="text-[#716F6C] text-[13px]">{t('pastYearProblems.subtitle')}</p>
      </div>

      <div className="flex gap-8 items-start">
        <div className="w-[320px] shrink-0">
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-4">
              <Search size={16} className="text-[#716F6C]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('pastYearProblems.searchPlaceholder')}
                className="w-full border border-[#Eeece9] rounded-md text-[13px] px-3 py-2 outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="border border-[#Eeece9] rounded-md text-[13px] px-3 py-2 bg-white text-[#201E1C]"
              >
                <option value="">{t('pastYearProblems.filterExamType')}</option>
                {(filters.exam_types || []).map((examType) => (
                  <option key={examType} value={examType}>
                    {examType.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-[#Eeece9] rounded-md text-[13px] px-3 py-2 bg-white text-[#201E1C]"
              >
                <option value="">{t('pastYearProblems.filterYear')}</option>
                {(filters.years || []).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-[#Eeece9] rounded-md text-[13px] px-3 py-2 bg-white text-[#201E1C]"
              >
                <option value="">{t('pastYearProblems.filterSubject')}</option>
                {(filters.subjects || []).map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={selectedPaper}
                onChange={(e) => setSelectedPaper(e.target.value)}
                className="border border-[#Eeece9] rounded-md text-[13px] px-3 py-2 bg-white text-[#201E1C]"
              >
                <option value="">{t('pastYearProblems.filterPaper')}</option>
                {(filters.papers || []).map((paper) => (
                  <option key={paper} value={paper}>
                    {paper}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="w-full bg-white border border-[#Eeece9] py-2 px-4 rounded-md text-[13px] font-medium text-[#201E1C] cursor-pointer hover:bg-[#f9f9f9] transition-colors"
            >
              {t('pastYearProblems.clearFilters')}
            </button>

            {(filtersError || problemsError) && (
              <div className="mt-4 bg-[#FBEEED] text-[#9C2E24] text-[12px] p-3 rounded-md">
                {t('pastYearProblems.errorLoading')}
              </div>
            )}

            {(isLoadingFilters || isLoadingProblems) && (
              <div className="mt-4 text-[12px] text-[#716F6C]">{t('pastYearProblems.loading')}</div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4">
            <div className="text-[13px] text-[#716F6C]">
              {t('pastYearProblems.totalFound')}: <strong className="text-[#201E1C]">{Array.isArray(problemsData) ? problemsData.length : 0}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Array.isArray(problemsData) && problemsData.length > 0 ? (
              problemsData.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`text-left bg-white border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors cursor-pointer ${
                    selectedProblem?.id === problem.id
                      ? 'border-primary bg-[#FDF9F5]'
                      : 'border-[#Eeece9] hover:bg-[#faf9f7]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[1px]">
                    <span className="px-2 py-1 rounded bg-[#fbefe9] text-primary font-semibold">{problem.exam_type}</span>
                    <span className="px-2 py-1 rounded bg-[#f0f0f0] text-[#716F6C] font-semibold">{problem.year}</span>
                    {problem.paper && <span className="px-2 py-1 rounded bg-[#e6f3eb] text-[#2B7A4B] font-semibold">{problem.paper}</span>}
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#201E1C] leading-[1.5] mb-2">
                    {problem.question_text}
                  </h3>
                  <div className="text-[12px] text-[#716F6C]">
                    {problem.subject || t('pastYearProblems.noSubject')}
                    {problem.topic ? ` · ${problem.topic}` : ''}
                  </div>
                </button>
              ))
            ) : (
              <div className="bg-white border border-[#Eeece9] rounded-xl p-6 text-[13px] text-[#716F6C]">
                {t('pastYearProblems.noData')}
              </div>
            )}
          </div>
        </div>

        <div className="w-[380px] shrink-0">
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sticky top-[96px]">
            {selectedProblem ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] uppercase tracking-[1px] text-primary font-semibold">
                    {selectedProblem.exam_type} · {selectedProblem.year}
                  </span>
                  <div className="text-[11px] text-[#716F6C] flex items-center gap-1">
                    <CalendarRange size={12} />
                    {selectedProblem.paper || t('pastYearProblems.noPaper')}
                  </div>
                </div>

                <h4 className="text-[16px] font-semibold text-[#201E1C] leading-[1.6] mb-4">
                  {selectedProblem.question_text}
                </h4>

                {(selectedProblem.option_a || selectedProblem.option_b || selectedProblem.option_c || selectedProblem.option_d) && (
                  <div className="mb-4">
                    <div className="text-[11px] uppercase tracking-[1px] text-[#716F6C] font-semibold mb-2">
                      {t('pastYearProblems.options')}
                    </div>
                    <div className="flex flex-col gap-2 text-[13px] text-[#201E1C]">
                      {selectedProblem.option_a && <div>A. {selectedProblem.option_a}</div>}
                      {selectedProblem.option_b && <div>B. {selectedProblem.option_b}</div>}
                      {selectedProblem.option_c && <div>C. {selectedProblem.option_c}</div>}
                      {selectedProblem.option_d && <div>D. {selectedProblem.option_d}</div>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
                  <div className="bg-[#f4f3ef] p-3 rounded-md">
                    <div className="text-[#716F6C] mb-1">{t('pastYearProblems.subject')}</div>
                    <div className="text-[#201E1C] font-medium">{selectedProblem.subject || '-'}</div>
                  </div>
                  <div className="bg-[#f4f3ef] p-3 rounded-md">
                    <div className="text-[#716F6C] mb-1">{t('pastYearProblems.marks')}</div>
                    <div className="text-[#201E1C] font-medium">{selectedProblem.marks || '-'}</div>
                  </div>
                  <div className="bg-[#f4f3ef] p-3 rounded-md">
                    <div className="text-[#716F6C] mb-1">{t('pastYearProblems.wordLimit')}</div>
                    <div className="text-[#201E1C] font-medium">{selectedProblem.word_limit || '-'}</div>
                  </div>
                  <div className="bg-[#f4f3ef] p-3 rounded-md">
                    <div className="text-[#716F6C] mb-1">{t('pastYearProblems.correctOption')}</div>
                    <div className="text-[#201E1C] font-medium">{selectedProblem.correct_option || '-'}</div>
                  </div>
                </div>

                {selectedProblem.explanation && (
                  <div className="bg-[#FDF9F5] border border-[#EED4C3] rounded-md p-4 text-[13px] text-[#9C4528] leading-[1.6]">
                    <div className="text-[10px] uppercase tracking-[1px] font-semibold mb-1 flex items-center gap-1">
                      <FileText size={12} />
                      {t('pastYearProblems.explanation')}
                    </div>
                    {selectedProblem.explanation}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[13px] text-[#716F6C]">{t('pastYearProblems.selectProblem')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastYearProblems;
