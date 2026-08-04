import Icon from '../components/Icon.jsx';

export default function PrivacyPage() {
  return (
    <div className="page docs-page" style={{ textAlign: 'left' }}>
      <div className="docs-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="lock" size={26} /> 隱私安全與 Cookies 政策</h1>
        <p className="muted">CHubb-Man 致力於保護您的 Discord 帳號隱私，並確保資料傳輸與儲存的絕對安全。</p>
      </div>

      <div className="docs-content" style={{ marginTop: '24px' }}>
        <section className="docs-section">
          <h2>一、 隱私權政策 (Privacy Policy)</h2>
          <p>當您使用 Discord 帳號登入 CHubb-Man 儀表板時，我們會經由 Discord OAuth2 授權取得以下必要的最小資訊：</p>
          <ul>
            <li>
              <strong>您的個人身分資訊：</strong> 包括您的 Discord 使用者 ID、使用者名稱、頭像。這些資料僅用於在儀表板右上角顯示您的登入狀態與基本身分標識。
            </li>
            <li>
              <strong>您加入的伺服器列表（Guilds）：</strong> 我們需要讀取您所加入的伺服器清單，以篩選並顯示您擁有「管理員 (Administrator)」權限的伺服器，讓您能夠進入控制台。我們<strong>絕不會</strong>越權讀取或干涉您不具備管理員權限的伺服器。
            </li>
            <li>
              <strong>工單與對話紀錄：</strong> 當您或您的成員關閉 Discord 中的工單時，系統會產出 HTML 對話紀錄。這些資料會被加密儲存於專屬的 MongoDB 資料庫中，僅供該伺服器之授權管理員與客服人員查閱。
            </li>
          </ul>
        </section>

        <section className="docs-section" style={{ marginTop: '32px' }}>
          <h2>二、 資訊安全防護 (Security Measures)</h2>
          <p>為了確保您的社群數據與金鑰不會外洩，CHubb-Man 採用了企業級的防護手段：</p>
          <ul>
            <li>
              <strong>傳輸層加密 (HTTPS)：</strong> 所有網頁與 API 之間的通訊皆經由安全的 SSL/TLS 加密通道進行，防止任何中間人竊聽或攔截。
            </li>
            <li>
              <strong>API 與 Bot 內部 HMAC 簽章機制：</strong> 為了防止他人偽造 Webhook 事件（例如：假造工單建立或警告事件），Bot 與 API 後端之間的所有請求標頭皆附帶以 <code>HMAC-SHA256</code> 雜湊算法產生的安全特徵碼。非經授權的請求將會被直接拒絕。
            </li>
            <li>
              <strong>敏感憑證保護：</strong> 所有敏感金鑰（例如 <code>DISCORD_BOT_TOKEN</code>、資料庫密碼）皆保存在環境變數中，<strong>絕不上傳</strong>至公開程式碼倉庫（Git Repository）。
            </li>
          </ul>
        </section>

        <section className="docs-section" style={{ marginTop: '32px' }}>
          <h2>三、 Cookies 政策 (Cookies Policy)</h2>
          <p>CHubb-Man 使用 Cookies 的唯一目的是為了保障網站的基本運作與提升您的使用體驗。我們使用的 Cookie 具有以下特性：</p>
          <ul>
            <li>
              <strong>登入狀態維持（Session Cookie）：</strong> 當您登入後，我們會在您的瀏覽器寫入一個名為 <code>connect.sid</code> 的 Cookie。這是一個安全的工作階段（Session）標識符，用來記住您的登入身分，讓您不用在每次重新整理網頁時重複登入。
            </li>
            <li>
              <strong>安全性配置 (HTTP-Only & SameSite)：</strong> 所有的 Session Cookie 皆開啟了 <code>HttpOnly</code> 屬性（JavaScript 無法存取，防範 XSS 攻擊）與 <code>SameSite=Lax</code>（防止跨站請求偽造 CSRF 攻擊）。
            </li>
            <li>
              <strong>喜好設定記住（Theme Cookie）：</strong> 用於記住您選擇的「深色模式」或「淺色模式」主題配置。
            </li>
            <li>
              <strong>不追蹤原則：</strong> 我們<strong>絕不使用</strong>任何廣告追蹤型 Cookie，也<strong>絕不向</strong>第三方行銷公司透露任何您的瀏覽行為。
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
