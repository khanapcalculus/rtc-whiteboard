import React from 'react';
import '../styles/Toolbar.css';

const Toolbar = React.memo(({ plugins, activePlugin, setActivePlugin }) => {
  const handlePluginClick = (plugin) => {
    // Deactivate current plugin
    if (activePlugin) {
      activePlugin.deactivate();
    }
    
    // Activate new plugin
    setActivePlugin(plugin.activate());
  };

  return (
    <div className="toolbar">
      {plugins.map((plugin, index) => (
        <div 
          key={index}
          className={`tool-button ${activePlugin === plugin ? 'active' : ''}`}
          onClick={() => handlePluginClick(plugin)}
          title={plugin.name}
        >
          <img src={plugin.icon} alt={plugin.name} />
        </div>
      ))}
    </div>
  );
});

export default Toolbar;