import React from 'react';
import Icon from './Icon.jsx';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'left'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--danger)',
            borderRadius: '10px',
            padding: '28px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'rgba(255, 71, 87, 0.12)',
                color: 'var(--danger)',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="alert" size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--fg)' }}>
                  頁面載入異常
                </h3>
                <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  系統已安全攔截此錯誤，避免畫面跳白。
                </p>
              </div>
            </div>

            <div style={{
              background: 'var(--code-bg)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: 'var(--danger)',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.toString() || '未知錯誤'}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="primary" onClick={this.handleReload}>
                <Icon name="webhook" size={14} /> 重新整理頁面
              </button>
              <button className="ghost" onClick={this.handleReset}>
                <Icon name="home" size={14} /> 返回首頁
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
