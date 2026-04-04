import React from 'react';

export const topNavBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px'
};

export const fileCmdBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#323130', fontSize: '13px', textAlign: 'left', width: '100%', justifyContent: 'flex-start', transition: 'background 0.1s'
};

export const ribbonGroupStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', borderRight: '1px solid #d2d0ce', paddingRight: '20px'
};

export const ribbonBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#323130'
};

export const ribbonLabelStyle: React.CSSProperties = {
  fontSize: '11px', color: '#605e5c', marginTop: 'auto'
};

export const iconBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer', color: '#605e5c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px'
};

export const dropdownItemStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#323130', fontSize: '12px', textAlign: 'left', width: '100%', transition: 'background 0.1s',
};

export const ribbonGroupTitleStyle: React.CSSProperties = {
  fontSize: '11px', color: '#605e5c', padding: '2px 0', borderTop: '1px solid #d2d0ce', width: '100%', textAlign: 'center', marginTop: 'auto'
};

export const ribbonBigBtnStyle: React.CSSProperties = {
  ...ribbonBtnStyle, flexDirection: 'column', height: '66px', width: '64px', fontSize: '11px', gap: '4px', textAlign: 'center'
};

export const ribbonSmallBtnStyle: React.CSSProperties = {
  ...ribbonBtnStyle, padding: '2px 4px', fontSize: '11px', gap: '6px', justifyContent: 'flex-start', height: '24px'
};

export const ribbonToolBtnStyle: React.CSSProperties = {
    background: 'transparent', border: '1px solid transparent', borderRadius: '2px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#323130', transition: 'background 0.1s, border-color 0.1s'
};

export const ribbonDropdownStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d2d0ce', borderRadius: '2px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', backgroundColor: 'white', height: '22px'
};

export const galleryItemStyle: React.CSSProperties = {
  width: '48px', height: '48px', border: '1px solid #d2d0ce', backgroundColor: 'white', cursor: 'pointer', borderRadius: '2px', flexShrink: 0, padding: '2px'
};

export const wrapIconBtnStyle: React.CSSProperties = {
    background: 'white', border: '1px solid #d2d0ce', borderRadius: '2px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.1s'
};

export const dialogRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px'
};

export const dialogSelectStyle: React.CSSProperties = {
    border: '1px solid #d2d0ce', borderRadius: '2px', fontSize: '12px', padding: '2px 4px'
};

export const dialogInputStyle: React.CSSProperties = {
    border: '1px solid #d2d0ce', borderRadius: '2px', fontSize: '12px', padding: '2px 4px', width: '60px'
};

export const dialogBtnStyle: React.CSSProperties = {
    backgroundColor: '#185abd', color: 'white', border: '1px solid #185abd', borderRadius: '2px', padding: '4px 20px', cursor: 'pointer', minWidth: '80px', fontSize: '13px'
};
