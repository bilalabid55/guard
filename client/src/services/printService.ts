// Print service for visitor badges
export const printBadge = (visitorData: any) => {
  const qrData: string = visitorData.qrCode;
  const qrImg = typeof qrData === 'string' && (qrData.startsWith('http') || qrData.startsWith('data:'))
    ? qrData
    : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData || JSON.stringify({ visitorId: visitorData._id, badgeNumber: visitorData.badgeNumber }))}`;
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  
  if (!printWindow) {
    alert('Please allow popups to print the badge');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Visitor Badge - ${visitorData.fullName}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .badge-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .badge-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1976d2, #4caf50, #ff9800);
          border-radius: 8px 8px 0 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .site-name {
          font-size: 18px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 5px;
        }
        
        .badge-title {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .divider {
          border-top: 1px solid #e0e0e0;
          margin: 15px 0;
        }
        
        .main-content {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .qr-section {
          flex: 0 0 80px;
        }
        
        .qr-code {
          width: 80px;
          height: 80px;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
        
        .visitor-info {
          flex: 1;
        }
        
        .visitor-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .badge-number {
          font-size: 12px;
          color: #666;
        }
        
        .access-info {
          margin-bottom: 15px;
        }
        
        .access-point {
          display: inline-block;
          background: #1976d2;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .special-access {
          display: inline-block;
          background: #ff9800;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .time-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .time-label {
          color: #666;
        }
        
        .time-value {
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
          color: #666;
        }
        
        .print-button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 20px auto;
          display: block;
        }
        
        .print-button:hover {
          background: #1565c0;
        }
      </style>
    </head>
    <body>
      <div class="badge-container">
        <div class="header">
          <div class="site-name">${visitorData.site.name}</div>
          <div class="badge-title">Visitor Badge</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="main-content">
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrImg}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
          </div>
          <div class="visitor-info">
            <div class="visitor-name">${visitorData.fullName}</div>
            <div class="company">${visitorData.company}</div>
            <div class="badge-number">Badge: ${visitorData.badgeNumber}</div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="access-info">
          <div class="access-point">${visitorData.accessPoint.name}</div>
          ${visitorData.specialAccess && visitorData.specialAccess !== 'none' ? 
            `<div class="special-access">${visitorData.specialAccess.toUpperCase()}</div>` : 
            ''
          }
        </div>
        
        <div class="time-info">
          <div>
            <div class="time-label">Check-in:</div>
            <div class="time-value">${new Date(visitorData.checkInTime).toLocaleString()}</div>
          </div>
          <div>
            <div class="time-label">Duration:</div>
            <div class="time-value">${visitorData.expectedDuration || 4} hours</div>
          </div>
        </div>
        
        <div class="footer">
          Keep this badge visible at all times
        </div>
      </div>
      
      <button class="print-button" onclick="window.print()">Print Badge</button>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

export const printMultipleBadges = (visitors: any[]) => {
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  
  if (!printWindow) {
    alert('Please allow popups to print the badges');
    return;
  }

  const badgesHtml = visitors.map(visitor => `
    <div class="badge-container" style="page-break-after: always; margin-bottom: 20px;">
      <div class="header">
        <div class="site-name">${visitor.site.name}</div>
        <div class="badge-title">Visitor Badge</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="main-content">
        <div class="qr-section">
          <div class="qr-code">
            <img src="${visitor.qrCode}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
        <div class="visitor-info">
          <div class="visitor-name">${visitor.fullName}</div>
          <div class="company">${visitor.company}</div>
          <div class="badge-number">Badge: ${visitor.badgeNumber}</div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="access-info">
        <div class="access-point">${visitor.accessPoint.name}</div>
        ${visitor.specialAccess && visitor.specialAccess !== 'none' ? 
          `<div class="special-access">${visitor.specialAccess.toUpperCase()}</div>` : 
          ''
        }
      </div>
      
      <div class="time-info">
        <div>
          <div class="time-label">Check-in:</div>
          <div class="time-value">${new Date(visitor.checkInTime).toLocaleString()}</div>
        </div>
        <div>
          <div class="time-label">Duration:</div>
          <div class="time-value">${visitor.expectedDuration || 4} hours</div>
        </div>
      </div>
      
      <div class="footer">
        Keep this badge visible at all times
      </div>
    </div>
  `).join('');

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Visitor Badges</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        
        .badge-container {
          max-width: 400px;
          margin: 0 auto 20px auto;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .badge-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #1976d2, #4caf50, #ff9800);
          border-radius: 8px 8px 0 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .site-name {
          font-size: 18px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 5px;
        }
        
        .badge-title {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .divider {
          border-top: 1px solid #e0e0e0;
          margin: 15px 0;
        }
        
        .main-content {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .qr-section {
          flex: 0 0 80px;
        }
        
        .qr-code {
          width: 80px;
          height: 80px;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
        
        .visitor-info {
          flex: 1;
        }
        
        .visitor-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .badge-number {
          font-size: 12px;
          color: #666;
        }
        
        .access-info {
          margin-bottom: 15px;
        }
        
        .access-point {
          display: inline-block;
          background: #1976d2;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .special-access {
          display: inline-block;
          background: #ff9800;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .time-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .time-label {
          color: #666;
        }
        
        .time-value {
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
          color: #666;
        }
        
        .print-button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 20px auto;
          display: block;
        }
        
        .print-button:hover {
          background: #1565c0;
        }
      </style>
    </head>
    <body>
      ${badgesHtml}
      
      <button class="print-button" onclick="window.print()">Print All Badges</button>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

