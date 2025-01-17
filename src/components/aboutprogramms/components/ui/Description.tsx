import { PROFILE } from '../../config/profile.ts';
import React from 'react';
import './style.css'
export const Description = () => (
  <div className="description-container">
    <p className="description-text">{PROFILE.description}</p>
    <p className="description-text">شهادتي من شركة السديم التقنية</p>
    <a href={PROFILE.cvlink} className="custom-link">Sadeem internship</a>
    
          </div>
);