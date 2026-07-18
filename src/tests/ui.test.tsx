// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { createDefaultProfile, useAppStore } from '../store/useAppStore';

beforeEach(() => {
  localStorage.clear();
  history.pushState({}, '', '/');
  useAppStore.setState({ initialized: false, profiles: [], activeProfileId: undefined, draftProfile: createDefaultProfile(), recommendationMode: 'universal', displayMode: 'popular', scene: 'commute' });
});

afterEach(() => cleanup());

describe('页面主流程', () => {
  test('首页能够渲染并展示个人/通用模式切换', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: '今日通用穿衣参考' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '个人定制' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '通用参考' })).toBeTruthy();
  });

  test('首页默认显示通用参考且无需出生信息', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: '今日通用穿衣参考' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '通用五行穿衣' })).toBeTruthy();
    expect(screen.getByText('顺利贵人色')).toBeTruthy();
    expect(screen.getByText('压力山大色')).toBeTruthy();
    expect(screen.queryByText(/\d+\.\d+分/)).toBeNull();
    expect(screen.queryByRole('combobox', { name: '使用场景' })).toBeNull();
  });

  test('导航到档案页后显示县级出生地选择与隐私保存说明', async () => {
    render(<App />);
    const links = await screen.findAllByRole('link', { name: /个人档案/ });
    fireEvent.click(links[0]);
    expect(await screen.findByRole('heading', { name: '个人档案' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '省 / 自治区 / 直辖市' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '地级市 / 州 / 盟' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '区 / 县 / 县级市' })).toBeTruthy();
    expect(screen.getByText(/点击“保存到本机”后/)).toBeTruthy();
  });

  test('切换区县会更新经纬度且保留手动时区', async () => {
    render(<App />);
    const links = await screen.findAllByRole('link', { name: /个人档案/ });
    fireEvent.click(links[0]);
    await screen.findByRole('heading', { name: '个人档案' });

    const timezoneInput = screen.getByRole('combobox', { name: '时区' });
    fireEvent.change(timezoneInput, { target: { value: 'Asia/Tokyo' } });

    const countySelect = screen.getByRole('combobox', { name: '区 / 县 / 县级市' });
    fireEvent.change(countySelect, { target: { value: '110109' } });

    expect((timezoneInput as HTMLInputElement).value).toBe('Asia/Tokyo');
    expect((screen.getByLabelText('经度（选择区县后自动带出）') as HTMLInputElement).value).toBe('115.793799');
  });

  test('命理分析页只显示中文状态并使用对齐表格', async () => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile, displayMode: 'advanced' });
    history.pushState({}, '', '/analysis');

    render(<App />);
    expect(await screen.findByRole('heading', { name: '命理分析' })).toBeTruthy();
    expect(screen.queryByText('potential')).toBeNull();
    expect(screen.getByRole('columnheader', { name: '组合关系' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '当前判断' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '说明' })).toBeTruthy();
  });


  test('首页日期与场景使用同一工具栏结构', async () => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile, recommendationMode: 'personal' });
    render(<App />);
    expect(await screen.findByLabelText('穿衣日期')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '使用场景' })).toBeTruthy();
    expect(screen.getByLabelText('穿衣日期').closest('.toolbar-field')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: '使用场景' }).closest('.toolbar-field')).toBeTruthy();
  });


  test('个人定制首页明确显示简洁详细专业三种模式', async () => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile, recommendationMode: 'personal' });
    render(<App />);
    expect(await screen.findByText('查看方式')).toBeTruthy();
    expect(screen.getByRole('button', { name: '简洁模式' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '详细模式' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '专业模式' })).toBeTruthy();
  });

  test('没有出生资料时进入专业模式会提示先创建命盘', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '个人定制' }));
    fireEvent.click(await screen.findByRole('button', { name: '专业模式' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '先完成个人命盘' })).toBeTruthy();
  });

  test('没有专业配置时进入专业模式会提示但允许只查看', async () => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile, recommendationMode: 'personal' });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '专业模式' }));
    expect(await screen.findByRole('heading', { name: '尚未设置专业配置' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '仅查看专业模式' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('专业校正页面未设置配置时明确显示仍使用基础判断', async () => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile });
    history.pushState({}, '', '/expert');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '专业校正' })).toBeTruthy();
    expect(screen.getByText('当前仍使用基础命盘判断')).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: '启用专业校正' }) as HTMLInputElement).disabled).toBe(true);
  });

  test.each([
    ['/', '今日通用穿衣参考'], ['/chart', '我的命盘'], ['/analysis', '命理分析'], ['/recommendation', '推荐详情'],
    ['/profiles', '个人档案'], ['/settings', '排盘设置'], ['/expert', '专业校正'], ['/about', '计算说明'],
  ])('所有页面均可正常打开：%s', async (path, heading) => {
    const profile = createDefaultProfile();
    profile.birthInput.localDateTime = '1988-11-20T06:00';
    useAppStore.setState({ initialized: true, draftProfile: profile, profiles: [profile], activeProfileId: profile.id });
    history.pushState({}, '', path);
    render(<App />);
    expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();
  });

});
