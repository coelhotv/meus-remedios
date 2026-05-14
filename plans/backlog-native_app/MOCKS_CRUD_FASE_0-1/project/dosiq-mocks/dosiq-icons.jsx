// dosiq-icons.jsx
// SVG icons used across Dosiq mobile mocks. Stroke-based, 24px viewBox.
// Match the visual weight of the MVP screens (1.75–2px strokes).

const I = ({ s = 22, c = 'currentColor', sw = 2, children, fill = 'none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0, display: 'block' }}>
    {children}
  </svg>
);

const IconChevronLeft  = (p) => <I {...p}><polyline points="15 18 9 12 15 6"/></I>;
const IconChevronRight = (p) => <I {...p}><polyline points="9 18 15 12 9 6"/></I>;
const IconChevronUp    = (p) => <I {...p}><polyline points="6 15 12 9 18 15"/></I>;
const IconChevronDown  = (p) => <I {...p}><polyline points="6 9 12 15 18 9"/></I>;
const IconPlus         = (p) => <I {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>;
const IconClose        = (p) => <I {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>;
const IconSearch       = (p) => <I {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I>;
const IconCheck        = (p) => <I {...p}><polyline points="20 6 9 17 4 12"/></I>;
const IconAlert        = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></I>;
const IconInfo         = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></I>;
const IconTrash        = (p) => <I {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></I>;
const IconEdit         = (p) => <I {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></I>;
const IconCalendar     = (p) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>;
const IconPill         = (p) => <I {...p}><path d="M10.5 20.5a7 7 0 0 1-9.9-9.9l9.9-9.9a7 7 0 0 1 9.9 9.9l-9.9 9.9z"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></I>;
const IconBox          = (p) => <I {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></I>;
const IconUser         = (p) => <I {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>;
const IconSun          = (p) => <I {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></I>;
const IconMoon         = (p) => <I {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></I>;
const IconSunset       = (p) => <I {...p}><path d="M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1"/><polyline points="16 5 12 9 8 5"/></I>;
const IconArrowDownRight = (p) => <I {...p}><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></I>;
const IconArrowUpRight = (p) => <I {...p}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></I>;
const IconShield       = (p) => <I {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></I>;
const IconLink         = (p) => <I {...p}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.43 1.43"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.43-1.43"/></I>;
const IconArrowLeft    = (p) => <I {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></I>;
const IconMore         = (p) => <I {...p}><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/></I>;
const IconBuilding     = (p) => <I {...p}><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/></I>;
const IconClock        = (p) => <I {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></I>;
const IconTag          = (p) => <I {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></I>;
const IconLayers       = (p) => <I {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></I>;
const IconBack         = (p) => <I {...p}><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></I>;

window.DosiqIcons = {
  IconChevronLeft, IconChevronRight, IconChevronUp, IconChevronDown,
  IconPlus, IconClose, IconSearch, IconCheck, IconAlert, IconInfo,
  IconTrash, IconEdit, IconCalendar, IconPill, IconBox, IconUser,
  IconSun, IconMoon, IconSunset, IconArrowDownRight, IconArrowUpRight,
  IconShield, IconLink, IconArrowLeft, IconMore, IconBuilding,
  IconClock, IconTag, IconLayers, IconBack,
};
