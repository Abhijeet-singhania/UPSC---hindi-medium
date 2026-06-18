import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PenLine, PinIcon, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader, Badge, TableOfContents } from '../../components/ui';

const GS_COLORS = {
  gs1: { accent: 'text-[#2B7A4B]', bg: 'bg-[#2B7A4B]/10', border: 'border-l-[#2B7A4B]' },
  gs2: { accent: 'text-[#1CB0F6]', bg: 'bg-[#1CB0F6]/10', border: 'border-l-[#1CB0F6]' },
  gs3: { accent: 'text-[#BFA532]', bg: 'bg-[#BFA532]/10', border: 'border-l-[#BFA532]' },
  gs4: { accent: 'text-[#CE82FF]', bg: 'bg-[#CE82FF]/10', border: 'border-l-[#CE82FF]' },
};

const TOC_ITEMS = [
  { id: 'sec-intro',    label: 'Introduction' },
  { id: 'sec-fiscal',   label: 'Fiscal Deficit' },
  { id: 'sec-frbm',     label: 'FRBM Act' },
  { id: 'sec-keydata',  label: 'Key Data Points' },
];

const NavItem = ({ label, gsKey, expanded, onToggle, children }) => {
  const c = GS_COLORS[gsKey] ?? GS_COLORS.gs1;
  return (
    <div className="border-b border-border-default last:border-0">
      <button
        className={`w-full bg-transparent border-none py-2.5 px-4 text-[13.5px] font-semibold text-text-primary flex justify-between items-center cursor-pointer transition-colors hover:bg-bg-surface
          ${expanded ? `${c.bg} ${c.accent}` : ''}`}
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${expanded ? `bg-current` : 'bg-border-strong'}`} />
          {label}
        </span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="text-text-muted" />}
      </button>
      {expanded && children && (
        <div className="pb-3 pl-5">
          <ul className="flex flex-col gap-0.5 border-l-2 border-border-default ml-3">
            {children}
          </ul>
        </div>
      )}
    </div>
  );
};

const NavLeaf = ({ label, active, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full text-left relative pl-4 py-1.5 text-[13px] cursor-pointer leading-snug transition-colors bg-transparent border-none
        ${active
          ? 'text-text-primary font-semibold bg-primary/8 border-l-2 border-primary -ml-px pl-[15px]'
          : 'text-text-muted hover:text-text-primary'
        }`}
    >
      {label}
    </button>
  </li>
);

const ReadingProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
      rafRef.current = null;
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const StudyContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState('gs3');
  const [activeNav, setActiveNav] = useState('nav3');

  const toggle = (key) => setExpandedSection(prev => (prev === key ? '' : key));

  return (
    <>
      <ReadingProgressBar />
      <div className="flex flex-col">
        <PageHeader title={t('studyContent.title')} subtitle={t('studyContent.subtitle')} />

        <div className="flex gap-6 items-start">
          {/* Left topics nav — sticky */}
          <div className="hidden md:block w-[220px] shrink-0 sticky top-[72px]">
            <div className="bg-bg-panel border border-border-default rounded-xl overflow-hidden">
              <NavItem label={t('studyContent.gsPaper1')} gsKey="gs1" expanded={expandedSection === 'gs1'} onToggle={() => toggle('gs1')} />
              <NavItem label={t('studyContent.gsPaper2')} gsKey="gs2" expanded={expandedSection === 'gs2'} onToggle={() => toggle('gs2')} />
              <NavItem label={t('studyContent.gsPaper3')} gsKey="gs3" expanded={expandedSection === 'gs3'} onToggle={() => toggle('gs3')}>
                {[
                  { key: 'nav1', label: t('studyContent.nav1') },
                  { key: 'nav2', label: t('studyContent.nav2') },
                  { key: 'nav3', label: t('studyContent.nav3') },
                  { key: 'nav4', label: t('studyContent.nav4') },
                  { key: 'nav5', label: t('studyContent.nav5') },
                  { key: 'nav6', label: t('studyContent.nav6') },
                ].map(item => (
                  <NavLeaf
                    key={item.key}
                    label={item.label}
                    active={activeNav === item.key}
                    onClick={() => setActiveNav(item.key)}
                  />
                ))}
              </NavItem>
              <NavItem label={t('studyContent.gsPaper4')} gsKey="gs4" expanded={expandedSection === 'gs4'} onToggle={() => toggle('gs4')} />
              <NavItem label={t('studyContent.optional')} gsKey="gs1" expanded={expandedSection === 'optional'} onToggle={() => toggle('optional')} />
            </div>
          </div>

          {/* Main reader — F-pattern: max-w 680px, generous line-height */}
          <div className="flex-1 min-w-0">
            <div className="bg-bg-panel border border-border-default rounded-xl">
              {/* Article header */}
              <div className="px-8 pt-8 pb-6 border-b border-border-default">
                <div className="flex items-center gap-2 mb-4 text-[13px] text-text-muted">
                  <span>GS3</span>
                  <span>›</span>
                  <span>Economy</span>
                  <span>›</span>
                  <strong className="text-text-secondary">{t('studyContent.nav3')}</strong>
                </div>
                <h1 className="text-[28px] font-serif font-semibold text-text-primary mb-3 leading-tight">
                  {t('studyContent.topicTitle')}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  <span className="text-text-muted">{t('studyContent.topicContext').split('|')[0]}</span>
                  <Badge variant="primary">{t('studyContent.topicContext').split('|')[1] ?? 'GS3'}</Badge>
                  <Badge variant="green">✓ 2 PYQs</Badge>
                  <span className="text-text-muted ml-auto">{t('studyContent.readTime')}</span>
                </div>
              </div>

              {/* Body — F-pattern reading width */}
              <div className="flex gap-8 px-8 py-8">
                <article className="max-w-[640px] min-w-0 text-[16px] leading-[1.8] text-text-secondary">
                  <h3 id="sec-intro" className="mt-0 mb-4 text-[19px] font-serif font-semibold text-text-primary scroll-mt-24">
                    {t('studyContent.q1Title')}
                  </h3>
                  <p className="mb-5">{t('studyContent.q1Body1')}</p>
                  <p className="mb-5">{t('studyContent.q1Body2')}</p>

                  {/* PYQ callout */}
                  <div className="border border-border-default border-l-4 border-l-primary bg-primary/5 rounded-lg p-5 my-7">
                    <div className="text-[10px] font-semibold text-primary uppercase tracking-[1.5px] mb-2 flex items-center gap-1.5">
                      <PinIcon size={11} /> {t('studyContent.pyq')}
                    </div>
                    <div className="italic text-[14px] text-text-primary leading-[1.65] mb-2">
                      {t('studyContent.pyqQuestion1')}
                    </div>
                    <div className="text-[11px] text-primary/70 tracking-[1px] uppercase">
                      {t('studyContent.pyqRef1')}
                    </div>
                  </div>

                  <h3 id="sec-fiscal" className="mt-8 mb-4 text-[19px] font-serif font-semibold text-text-primary scroll-mt-24">
                    {t('studyContent.q2Title')}
                  </h3>
                  <ul className="list-none mb-6 flex flex-col gap-2">
                    {[t('studyContent.bullet1'), t('studyContent.bullet2')].map((b, i) => (
                      <li key={i} className="relative pl-5 text-[15px]">
                        <span className="absolute left-0 top-[10px] w-[5px] h-[5px] rounded-full bg-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <h3 id="sec-frbm" className="mt-8 mb-4 text-[19px] font-serif font-semibold text-text-primary scroll-mt-24">
                    {t('studyContent.q3Title')}
                  </h3>
                  <p className="mb-5">
                    The Fiscal Responsibility and Budget Management (FRBM) Act, 2003 was India&apos;s landmark step toward rule-based fiscal management. It mandates that the government maintains fiscal deficit within specified limits and presents medium-term fiscal policy statements along with the Budget.
                  </p>

                  <div className="border border-border-default border-l-4 border-l-primary bg-primary/5 rounded-lg p-5 my-7">
                    <div className="text-[10px] font-semibold text-primary uppercase tracking-[1.5px] mb-2 flex items-center gap-1.5">
                      <PinIcon size={11} /> {t('studyContent.pyq')}
                    </div>
                    <div className="italic text-[14px] text-text-primary leading-[1.65] mb-2">
                      {t('studyContent.pyqQuestion2')}
                    </div>
                    <div className="text-[11px] text-primary/70 tracking-[1px] uppercase">
                      {t('studyContent.pyqRef2')}
                    </div>
                  </div>

                  <h3 id="sec-keydata" className="mt-8 mb-4 text-[19px] font-serif font-semibold text-text-primary scroll-mt-24">
                    {t('studyContent.keyData')}
                  </h3>
                  <ul className="list-none mb-6 flex flex-col gap-2">
                    {[
                      t('studyContent.dataBull1'),
                      t('studyContent.dataBull2'),
                      t('studyContent.dataBull3'),
                      'Revenue Deficit: 2% of GDP — indicates fiscal quality concern',
                    ].map((b, i) => (
                      <li key={i} className="relative pl-5 text-[15px]">
                        <span className="absolute left-0 top-[10px] w-[5px] h-[5px] rounded-full bg-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 pt-8 border-t border-border-default mt-8">
                    <button
                      onClick={() => navigate('/answers')}
                      className="bg-primary hover:bg-primary-hover border-none text-white flex items-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      <PenLine size={14} /> {t('studyContent.btnWriteAns')}
                    </button>
                    <button
                      onClick={() => navigate('/prelims')}
                      className="bg-transparent border border-border-default py-2 px-4 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary flex items-center gap-2 cursor-pointer hover:bg-bg-surface transition-colors"
                    >
                      ✧ {t('studyContent.btnMcq')}
                    </button>
                    <button
                      onClick={() => navigate('/prelims')}
                      className="bg-transparent border border-border-default py-2 px-4 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary flex items-center gap-2 cursor-pointer hover:bg-bg-surface transition-colors"
                    >
                      <Zap size={14} color="#D4613C" /> {t('studyContent.btnFlashcard')}
                    </button>
                  </div>
                </article>

                {/* Right TOC — sticky */}
                <div className="hidden xl:block w-[180px] shrink-0">
                  <TableOfContents items={TOC_ITEMS} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudyContent;
