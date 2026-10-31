import React from 'react';

const shapes = {
  terminal: <><path d="m4 6 5 5-5 5M12 18h8"/><rect x="1" y="2" width="22" height="20" rx="3"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  file_download: <><path d="M14 2H5v20h14V7l-5-5v5h5M12 10v8m-3-3 3 3 3-3"/></>,
  volume_up: <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
  volume_off: <><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/></>,
  help: <><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3h.01"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  code: <path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20"/>,
  description: <><path d="M14 2H4v20h16V8l-6-6v6h6M8 12h8m-8 4h6"/></>,
  code_blocks: <><rect x="2" y="2" width="20" height="20" rx="3"/><path d="m9 7-4 5 4 5m6-10 4 5-4 5"/></>,
  check: <path d="m4 12 5 5L20 5"/>,
  content_copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/></>,
  folder_zip: <><path d="M2 6h8l2 2h10v13H2V6Zm0 0V3h8l2 3m3 2v3m0 2v3m0 2v3"/></>,
  psychology: <><path d="M9 21v-4c-4-2-5-8-2-12a7 7 0 0 1 12 5l3 4h-4v7M10 8h6m-3-3v6"/></>,
  subdirectory_arrow_left: <path d="M20 4v11H4m5-5-5 5 5 5"/>,
  security: <><path d="m12 2 9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
  grid_view: <><rect x="2" y="2" width="8" height="8"/><rect x="14" y="2" width="8" height="8"/><rect x="2" y="14" width="8" height="8"/><rect x="14" y="14" width="8" height="8"/></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8L21 9h-8l1-7Z"/>,
  arrow: <path d="M3 12h18m-7-7 7 7-7 7"/>
} satisfies Record<string, React.ReactNode>;
export type IconName = keyof typeof shapes;
export function Icon({name, className = ''}: {name: IconName; className?: string}) {
  return <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 align-middle ${className}`}>{shapes[name]}</svg>;
}
