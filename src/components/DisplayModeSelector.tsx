import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasExpertConfiguration, isExpertConfigurationActive } from '../lib/expertConfig';
import { useAppStore } from '../store/useAppStore';
import type { DisplayMode } from '../types/domain';
import { DecisionDialog } from './UI';

type ExpertPrompt = 'missing_birth' | 'missing_config' | 'config_disabled' | null;

export default function DisplayModeSelector({ placement = 'topbar', showLabel = false }: {
  placement?: 'topbar' | 'toolbar';
  showLabel?: boolean;
}) {
  const profile = useAppStore((state) => state.draftProfile);
  const displayMode = useAppStore((state) => state.displayMode);
  const setDisplayMode = useAppStore((state) => state.setDisplayMode);
  const navigate = useNavigate();
  const [expertPrompt, setExpertPrompt] = useState<ExpertPrompt>(null);

  const configured = hasExpertConfiguration(profile.expertOverride);
  const active = isExpertConfigurationActive(profile.expertOverride);

  const chooseDisplayMode = (mode: DisplayMode) => {
    if (mode !== 'expert') {
      setDisplayMode(mode);
      return;
    }
    if (!profile.birthInput.localDateTime) {
      setExpertPrompt('missing_birth');
      return;
    }
    if (!configured) {
      setExpertPrompt('missing_config');
      return;
    }
    if (!profile.expertOverride.enabled) {
      setExpertPrompt('config_disabled');
      return;
    }
    setDisplayMode('expert');
  };

  const enterExpertView = () => {
    setDisplayMode('expert');
    setExpertPrompt(null);
  };

  const promptContent = expertPrompt === 'missing_birth'
    ? {
        title: '先完成个人命盘',
        description: '专业模式需要先有出生时间和出生地。完成个人资料后，才能查看完整命理依据和专业校正内容。',
        primaryLabel: '去录入出生资料',
        secondaryLabel: '暂不进入',
        onPrimary: () => { setExpertPrompt(null); navigate('/profiles'); },
        onSecondary: () => setExpertPrompt(null),
      }
    : expertPrompt === 'missing_config'
      ? {
          title: '尚未设置专业配置',
          description: '当前仍会使用基础命盘判断。你可以先设置专业校正，也可以只进入专业模式查看完整分析；未设置的专业结论不会参与推荐。',
          primaryLabel: '去设置专业校正',
          secondaryLabel: '仅查看专业模式',
          onPrimary: () => { setExpertPrompt(null); navigate('/expert'); },
          onSecondary: enterExpertView,
        }
      : {
          title: '专业配置尚未启用',
          description: '当前档案中已有专业配置，但尚未参与命盘分析和穿衣推荐。你可以前往启用，也可以只查看专业模式。',
          primaryLabel: '去启用专业校正',
          secondaryLabel: '仅查看专业模式',
          onPrimary: () => { setExpertPrompt(null); navigate('/expert'); },
          onSecondary: enterExpertView,
        };

  return <>
    <div className={`display-mode-control ${placement === 'toolbar' ? 'toolbar-display-mode' : ''}`}>
      {showLabel && <span className="display-mode-label">查看方式</span>}
      <div className="display-mode" aria-label="查看方式">
        {([['popular', '简洁'], ['advanced', '详细'], ['expert', '专业']] as const).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-label={`${label}模式`}
            className={displayMode === value ? 'active' : ''}
            onClick={() => chooseDisplayMode(value)}
          >{label}</button>
        ))}
      </div>
      {placement === 'toolbar' && displayMode === 'expert' && (
        <small className={active ? 'expert-mode-active' : 'expert-mode-view-only'}>
          {active ? '专业校正已启用' : '当前仅查看专业内容'}
        </small>
      )}
    </div>
    <DecisionDialog
      open={Boolean(expertPrompt)}
      title={promptContent.title}
      description={promptContent.description}
      primaryLabel={promptContent.primaryLabel}
      secondaryLabel={promptContent.secondaryLabel}
      onPrimary={promptContent.onPrimary}
      onSecondary={promptContent.onSecondary}
      onClose={() => setExpertPrompt(null)}
    />
  </>;
}
