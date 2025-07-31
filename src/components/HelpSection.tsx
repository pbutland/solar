import React, { useState } from 'react';
import './HelpSection.css';

const HelpSection: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: false,
    dataUpload: false,
    solarData: false,
    calculations: false,
    financial: false,
    troubleshooting: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="help-section">
      <h2>Help &amp; Information</h2>

      <div className="help-accordion">
        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('overview')}
          >
            <h3>Overview</h3>
            <span className="expand-icon">{expandedSections.overview ? '−' : '+'}</span>
          </div>
          {expandedSections.overview && (
            <div className="help-content">
              <p>
                The Solar Power Optimizer helps you understand how solar panels and batteries could benefit your home by:
              </p>
              <ul>
                <li>Analyzing your electricity usage patterns</li>
                <li>Calculating potential solar generation based on your location</li>
                <li>Visualizing how different solar installation sizes and battery capacities could offset your energy consumption</li>
                <li>Estimating financial outcomes based on your electricity rates and solar feed-in tariffs</li>
              </ul>
              <p>
                To get started, enter your location details and upload your energy usage data from your distributor or retailer.
                Then adjust the installation size and battery capacity to see how different system configurations would perform.
                Enter your electricity rates and feed-in tariff in the <strong>Cost Configuration</strong> section to see a financial summary tailored to your situation.
              </p>
            </div>
          )}
        </div>

        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('dataUpload')}
          >
            <h3>Data Upload Format</h3>
            <span className="expand-icon">{expandedSections.dataUpload ? '−' : '+'}</span>
          </div>
          {expandedSections.dataUpload && (
            <div className="help-content">
              <p>
                The file upload supports the following data formats:
              </p>
              <ul>
                <li>AusNet</li>
                <li>Jemena</li>
                <li>NEM12 (Australian National Electricity Market standard)</li>
                <li>Origin Energy</li>
                <li>Powerpal</li>
              </ul>
              <p>
                For a detailed description of each supported file format, including required columns, see: <a href={`${import.meta.env.BASE_URL}data-file-formats.html`} target="_blank" rel="noopener noreferrer">Supported Data File Formats</a>
              </p>
              <p>
                <em>Note: The system will process consumption data only and ignore other entries.</em>
              </p>
            </div>
          )}
        </div>

        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('solarData')}
          >
            <h3>Solar Irradiance Data</h3>
            <span className="expand-icon">{expandedSections.solarData ? '−' : '+'}</span>
          </div>
          {expandedSections.solarData && (
            <div className="help-content">
              <p>
                Solar irradiance data is fetched from NASA's POWER (Prediction Of Worldwide Energy Resources) API:
              </p>
              <p className="code-link">
                https://power.larc.nasa.gov/api/temporal/daily/point
              </p>
              <p>
                This data represents the amount of solar energy reaching the earth's surface at your location,
                measured in kilowatt-hours per square meter per day (kWh/m²/day).
              </p>
              <p>
                The application uses the <code>ALLSKY_SFC_SW_DWN</code> parameter, which represents 
                "All Sky Surface Shortwave Downward Irradiance" - the most relevant measurement for solar panel performance.
              </p>
              <p>
                Data is collected for a full 365-day period to account for seasonal variations throughout the year.
                The solar data is crucial for accurately estimating how much electricity your solar panels could generate.
              </p>
              <p>
                <strong>How is daily solar irradiance used?</strong><br />
                For each day, the total solar irradiance value is distributed across the hours between sunrise and sunset using a normal (Gaussian) distribution.
                The distribution is centered at solar noon (the midpoint between sunrise and sunset), with most energy allocated during midday and less at the edges of daylight.
              </p>
            </div>
          )}
        </div>

        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('calculations')}
          >
            <h3>Data Processing &amp; Calculations</h3>
            <span className="expand-icon">{expandedSections.calculations ? '−' : '+'}</span>
          </div>
          {expandedSections.calculations && (
            <div className="help-content">
              <h4>Energy Usage Data Processing</h4>
              <p>
                When you upload your energy usage data, the system processes it as follows:
              </p>
              <ul>
                <li>Sorts all entries chronologically</li>
                <li>Takes the most recent 365 days of data</li>
                <li>Wraps the data to create a complete 365-day year starting from January 1st</li>
              </ul>
              
              <h4>Data Wrapping Explained</h4>
              <p>
                "Data wrapping" means organizing your energy usage by calendar day (month-day) regardless of year.
                This creates a standardized year of energy usage data starting from January 1st.
              </p>

              <h4>Solar Generation Calculation</h4>
              <p>
                Your potential solar generation is calculated using:
              </p>
              <ul>
                <li>Solar irradiance data for your specific location</li>
                <li>Your selected installation size (in kW)</li>
                <li>Standard assumptions about panel efficiency and system losses</li>
              </ul>
              <p>
                The daily generation estimate formula is:
              </p>
              <p className="formula">
                Daily Generation (kWh) = Installation Size (kW) × Irradiance (kWh/m²/day) × System Efficiency
              </p>
              <p>
                Where System Efficiency accounts for factors like panel conversion efficiency, 
                inverter losses, shading, and orientation.
              </p>
            </div>
          )}
        </div>

        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('financial')}
          >
            <h3>Financial Costing & Battery</h3>
            <span className="expand-icon">{expandedSections.financial ? '−' : '+'}</span>
          </div>
          {expandedSections.financial && (
            <div className="help-content">
              <h4>Battery Size</h4>
              <p>
                <strong>Battery Capacity</strong> (in kWh) lets you model the effect of adding a battery to your solar system. Increasing the battery size allows more excess solar energy to be stored for use at night or during peak times, reducing your reliance on grid electricity and potentially increasing your savings.
              </p>
              <ul>
                <li>Set the battery size to 0 to model a solar-only system.</li>
                <li>Increase the value to see how a larger battery can further reduce grid usage and costs.</li>
              </ul>
              <h4>Cost Configuration</h4>
              <p>
                The <strong>Cost Configuration</strong> section allows you to enter your electricity rates and solar system costs:
              </p>
              <ul>
                <li><strong>Solar Cost ($/kW):</strong> The installed cost per kW of solar panels.</li>
                <li><strong>Battery Cost ($/kWh):</strong> The installed cost per kWh of battery storage.</li>
                <li><strong>Peak rate (c/kWh):</strong> The rate you pay for electricity during peak times. <em>Enter this value in cents per kWh (e.g., 35 for $0.35/kWh).</em></li>
                <li><strong>Off-peak rate (c/kWh):</strong> The rate you pay for electricity during off-peak times. <em>Enter this value in cents per kWh.</em></li>
                <li><strong>Solar feed-in tariff (c/kWh):</strong> The rate you receive for exporting excess solar energy to the grid. <em>Enter this value in cents per kWh.</em></li>
                <li><strong>Export limit (kW):</strong> The maximum amount of solar power that can be exported to the grid per day. This reflects network restrictions or inverter settings that may cap how much solar energy you can send out. Any solar generation above this limit will not be exported.</li>
              </ul>
              <h4>Financial Summary</h4>
              <p>
                The <strong>Financial Summary</strong> estimates your annual electricity costs and potential savings based on your system configuration and rates. Adjust the installation size, battery capacity, and cost inputs to see how your choices affect your bottom line.
              </p>
            </div>
          )}
        </div>

        <div className="help-item">
          <div 
            className="help-header" 
            onClick={() => toggleSection('troubleshooting')}
          >
            <h3>Troubleshooting</h3>
            <span className="expand-icon">{expandedSections.troubleshooting ? '−' : '+'}</span>
          </div>
          {expandedSections.troubleshooting && (
            <div className="help-content">
              <h4>Common Issues</h4>
              
              <p><strong>Upload errors:</strong></p>
              <ul>
                <li>Check that your file is in one of the supported formats and that it contains the required columns (see <a href={`${import.meta.env.BASE_URL}data-file-formats.html`} target="_blank" rel="noopener noreferrer">Supported Data File Formats</a>).</li>
                <li>Ensure the file is not corrupted or too large (maximum size is 15MB)</li>
              </ul>
              
              <p><strong>Solar data issues:</strong></p>
              <ul>
                <li>Verify your latitude and longitude values are correct</li>
                <li>Some remote locations may have limited solar data coverage</li>
                <li>If the NASA API is temporarily unavailable, try again later</li>
              </ul>
              
              <p><strong>Display issues:</strong></p>
              <ul>
                <li>For optimal viewing, use a modern web browser like Chrome, Firefox, or Safari</li>
                <li>If charts don't render correctly, try refreshing the page</li>
                <li>For better visualization on small screens, use landscape orientation on mobile devices</li>
              </ul>
              
              <h4>Data Privacy</h4>
              <p>
                All processing happens in your browser - your energy data is never sent to any server
                except for the necessary location coordinates that are sent to the NASA POWER API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default HelpSection;
