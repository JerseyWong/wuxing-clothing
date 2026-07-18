import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import DisplayModeSelector from './DisplayModeSelector';

const NAV = [
  ['/', '今日穿衣', '衣'], ['/chart', '我的命盘', '盘'], ['/analysis', '命理分析', '析'],
  ['/recommendation', '推荐详情', '分'], ['/profiles', '个人档案', '人'], ['/settings', '排盘设置', '时'],
  ['/expert', '专业校正', '校'], ['/about', '计算说明', '说'],
] as const;

export default function Layout() {
  const initialize = useAppStore((state) => state.initialize);
  const profile = useAppStore((state) => state.draftProfile);
  const recommendationMode = useAppStore((state) => state.recommendationMode);
  const location = useLocation();

  useEffect(() => initialize(), [initialize]);

  const isHome = location.pathname === '/';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>五行</span><div><strong>个人穿衣</strong><small>每日五行配色</small></div></div>
      <nav>{NAV.map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/'}><i>{icon}</i><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-note"><small>当前档案</small><strong>{profile.name}</strong><span>{profile.birthInput.localDateTime ? profile.birthInput.localDateTime.replace('T', ' ') : '尚未录入出生时间'}</span></div>
    </aside>
    <div className="page-shell">
      <header className="topbar">
        <div><span className="mobile-brand">五行穿衣</span><small>传统文化参考 · 所有计算均在本机完成</small></div>
        {!isHome && <DisplayModeSelector />}
        {isHome && <span className="topbar-context">{recommendationMode === 'universal' ? '通用参考' : '个人定制'}</span>}
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="site-footer"><span>当前版本 2.1.6</span><span>内容仅作传统文化与日常配色参考</span></footer>
    </div>
    <nav className="mobile-nav">{NAV.slice(0, 5).map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/'}><i>{icon}</i><span>{label}</span></NavLink>)}</nav>
  </div>;
}
