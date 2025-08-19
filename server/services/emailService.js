const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.setupTransporter();
  }

  /**
   * Setup email transporter
   */
  setupTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        secure: true,
        port: 465
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error);
        } else {
          console.log('✅ Email service ready');
          this.initialized = true;
        }
      });
    } catch (error) {
      console.error('❌ Failed to setup email transporter:', error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email, token, firstName = '') {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Vietnam Stock Tracker <noreply@vietnamstocktracker.com>',
        to: email,
        subject: 'Xác thực email - Vietnam Stock Tracker',
        html: this.getEmailVerificationTemplate(firstName, verificationUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email verification sent to:', email);
      return result;
    } catch (error) {
      console.error('❌ Error sending email verification:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email, token, firstName = '') {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Vietnam Stock Tracker <noreply@vietnamstocktracker.com>',
        to: email,
        subject: 'Đặt lại mật khẩu - Vietnam Stock Tracker',
        html: this.getPasswordResetTemplate(firstName, resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', email);
      return result;
    } catch (error) {
      console.error('❌ Error sending password reset:', error);
      throw error;
    }
  }

  /**
   * Send alert notification
   */
  async sendAlertNotification(email, firstName, symbol, message, alertData) {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const subject = `🔔 Cảnh báo ${symbol} - Vietnam Stock Tracker`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Vietnam Stock Tracker <noreply@vietnamstocktracker.com>',
        to: email,
        subject: subject,
        html: this.getAlertNotificationTemplate(firstName, symbol, message, alertData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Alert notification sent to: ${email} for ${symbol}`);
      return result;
    } catch (error) {
      console.error('❌ Error sending alert notification:', error);
      throw error;
    }
  }

  /**
   * Send weekly portfolio report
   */
  async sendWeeklyReport(email, firstName, reportData) {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const subject = `📊 Báo cáo tuần - Vietnam Stock Tracker`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Vietnam Stock Tracker <noreply@vietnamstocktracker.com>',
        to: email,
        subject: subject,
        html: this.getWeeklyReportTemplate(firstName, reportData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Weekly report sent to: ${email}`);
      return result;
    } catch (error) {
      console.error('❌ Error sending weekly report:', error);
      throw error;
    }
  }

  /**
   * Send market news digest
   */
  async sendNewsDigest(email, firstName, newsItems) {
    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const subject = `📰 Tóm tắt tin tức thị trường - Vietnam Stock Tracker`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Vietnam Stock Tracker <noreply@vietnamstocktracker.com>',
        to: email,
        subject: subject,
        html: this.getNewsDigestTemplate(firstName, newsItems)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ News digest sent to: ${email}`);
      return result;
    } catch (error) {
      console.error('❌ Error sending news digest:', error);
      throw error;
    }
  }

  /**
   * Email verification template
   */
  getEmailVerificationTemplate(firstName, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Xác thực Email</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📊 Vietnam Stock Tracker</div>
            </div>
            
            <h2>Xin chào ${firstName}!</h2>
            
            <p>Cảm ơn bạn đã đăng ký tài khoản Vietnam Stock Tracker. Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn.</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác thực Email</a>
            </div>
            
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p><strong>Lưu ý:</strong> Link xác thực sẽ hết hạn sau 24 giờ.</p>
            
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            
            <div class="footer">
                <p>Vietnam Stock Tracker - Theo dõi danh mục đầu tư chứng khoán Việt Nam</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Password reset template
   */
  getPasswordResetTemplate(firstName, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Đặt lại mật khẩu</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📊 Vietnam Stock Tracker</div>
            </div>
            
            <h2>Xin chào ${firstName}!</h2>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <div class="warning">
                <p><strong>⚠️ Lưu ý bảo mật:</strong></p>
                <ul>
                    <li>Link này sẽ hết hạn sau 10 phút</li>
                    <li>Chỉ sử dụng link này nếu bạn đã yêu cầu đặt lại mật khẩu</li>
                    <li>Không chia sẻ link này với bất kỳ ai</li>
                </ul>
            </div>
            
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và tài khoản của bạn sẽ vẫn an toàn.</p>
            
            <div class="footer">
                <p>Vietnam Stock Tracker - Theo dõi danh mục đầu tư chứng khoán Việt Nam</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Alert notification template
   */
  getAlertNotificationTemplate(firstName, symbol, message, alertData) {
    const priceColor = alertData.change >= 0 ? '#16a34a' : '#dc2626';
    const changePrefix = alertData.change >= 0 ? '+' : '';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Cảnh báo ${symbol}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
            .price-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .price { font-size: 24px; font-weight: bold; color: ${priceColor}; }
            .change { color: ${priceColor}; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📊 Vietnam Stock Tracker</div>
            </div>
            
            <h2>🔔 Cảnh báo ${symbol}</h2>
            
            <p>Xin chào ${firstName}!</p>
            
            <div class="alert-box">
                <h3>Cảnh báo được kích hoạt</h3>
                <p>${message}</p>
            </div>
            
            <div class="price-info">
                <h4>Thông tin giá hiện tại:</h4>
                <div class="price">${alertData.currentPrice.toLocaleString()} VND</div>
                <div class="change">
                    ${changePrefix}${alertData.change.toLocaleString()} VND (${changePrefix}${alertData.changePercent.toFixed(2)}%)
                </div>
                <p><strong>Loại cảnh báo:</strong> ${this.getAlertTypeText(alertData.alertType)}</p>
                <p><strong>Điều kiện:</strong> ${this.getConditionText(alertData.condition, alertData.targetValue)}</p>
            </div>
            
            <p>Vui lòng kiểm tra danh mục đầu tư của bạn để xem xét các quyết định đầu tư phù hợp.</p>
            
            <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                    Xem Dashboard
                </a>
            </p>
            
            <div class="footer">
                <p>Vietnam Stock Tracker - Theo dõi danh mục đầu tư chứng khoán Việt Nam</p>
                <p>Để hủy cảnh báo này, vui lòng truy cập trang quản lý cảnh báo.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Weekly report template
   */
  getWeeklyReportTemplate(firstName, reportData) {
    const totalReturnColor = reportData.totalReturn >= 0 ? '#16a34a' : '#dc2626';
    const returnPrefix = reportData.totalReturn >= 0 ? '+' : '';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Báo cáo tuần</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .summary-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
            .value { font-weight: bold; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            .portfolio { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📊 Vietnam Stock Tracker</div>
                <h2>Báo cáo tuần</h2>
                <p>${reportData.weekStart} - ${reportData.weekEnd}</p>
            </div>
            
            <p>Xin chào ${firstName}!</p>
            
            <p>Dưới đây là tóm tắt hiệu suất danh mục đầu tư của bạn trong tuần qua:</p>
            
            <div class="summary-box">
                <h3>Tổng quan</h3>
                <div class="metric">
                    <span>Tổng giá trị danh mục:</span>
                    <span class="value">${reportData.totalValue.toLocaleString()} VND</span>
                </div>
                <div class="metric">
                    <span>Tổng lợi nhuận/lỗ:</span>
                    <span class="value ${reportData.totalReturn >= 0 ? 'positive' : 'negative'}">
                        ${returnPrefix}${reportData.totalReturn.toLocaleString()} VND (${returnPrefix}${reportData.totalReturnPercent.toFixed(2)}%)
                    </span>
                </div>
                <div class="metric">
                    <span>Thay đổi trong tuần:</span>
                    <span class="value ${reportData.weekChange >= 0 ? 'positive' : 'negative'}">
                        ${reportData.weekChange >= 0 ? '+' : ''}${reportData.weekChange.toLocaleString()} VND
                    </span>
                </div>
            </div>
            
            <h3>Danh mục của bạn</h3>
            ${reportData.portfolios.map(portfolio => `
                <div class="portfolio">
                    <h4>${portfolio.name}</h4>
                    <div class="metric">
                        <span>Giá trị:</span>
                        <span class="value">${portfolio.currentValue.toLocaleString()} VND</span>
                    </div>
                    <div class="metric">
                        <span>Thay đổi tuần:</span>
                        <span class="value ${portfolio.weekChange >= 0 ? 'positive' : 'negative'}">
                            ${portfolio.weekChange >= 0 ? '+' : ''}${portfolio.weekChange.toLocaleString()} VND
                        </span>
                    </div>
                    <div class="metric">
                        <span>Số mã cổ phiếu:</span>
                        <span class="value">${portfolio.stockCount}</span>
                    </div>
                </div>
            `).join('')}
            
            <h3>Top cổ phiếu hiệu suất tốt nhất</h3>
            <ul>
                ${reportData.topPerformers.map(stock => `
                    <li>${stock.symbol}: ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%</li>
                `).join('')}
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                    Xem chi tiết
                </a>
            </p>
            
            <div class="footer">
                <p>Vietnam Stock Tracker - Theo dõi danh mục đầu tư chứng khoán Việt Nam</p>
                <p>Để hủy báo cáo tuần, vui lòng cập nhật cài đặt thông báo trong tài khoản.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * News digest template
   */
  getNewsDigestTemplate(firstName, newsItems) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Tóm tắt tin tức thị trường</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .news-item { border-bottom: 1px solid #e5e7eb; padding: 20px 0; }
            .news-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .news-summary { color: #6b7280; margin-bottom: 10px; }
            .news-meta { font-size: 12px; color: #9ca3af; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📊 Vietnam Stock Tracker</div>
                <h2>📰 Tóm tắt tin tức thị trường</h2>
            </div>
            
            <p>Xin chào ${firstName}!</p>
            
            <p>Dưới đây là những tin tức quan trọng nhất về thị trường chứng khoán Việt Nam hôm nay:</p>
            
            ${newsItems.map(news => `
                <div class="news-item">
                    <div class="news-title">${news.title}</div>
                    <div class="news-summary">${news.summary}</div>
                    <div class="news-meta">
                        ${news.source} • ${news.publishTime} • ${news.category}
                    </div>
                </div>
            `).join('')}
            
            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/news" style="display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                    Đọc thêm tin tức
                </a>
            </p>
            
            <div class="footer">
                <p>Vietnam Stock Tracker - Theo dõi danh mục đầu tư chứng khoán Việt Nam</p>
                <p>Để hủy tóm tắt tin tức, vui lòng cập nhật cài đặt thông báo trong tài khoản.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Helper methods for alert templates
   */
  getAlertTypeText(type) {
    const types = {
      'price': 'Cảnh báo giá',
      'volume': 'Cảnh báo khối lượng',
      'percent-change': 'Cảnh báo thay đổi %',
      'technical': 'Cảnh báo kỹ thuật',
      'news': 'Cảnh báo tin tức'
    };
    return types[type] || type;
  }

  getConditionText(condition, value) {
    const conditions = {
      'above': `Trên ${value?.toLocaleString()} VND`,
      'below': `Dưới ${value?.toLocaleString()} VND`,
      'percent-change-up': `Tăng ${value}%`,
      'percent-change-down': `Giảm ${value}%`,
      'volume-spike': 'Khối lượng đột biến',
      'new-high': 'Đạt đỉnh 52 tuần',
      'new-low': 'Đạt đáy 52 tuần'
    };
    return conditions[condition] || condition;
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Transporter not initialized');
      }

      await this.transporter.verify();
      console.log('✅ Email connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email connection test failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
