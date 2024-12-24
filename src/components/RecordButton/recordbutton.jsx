import React from 'react';
import './recordbutton.css'; // CSS dosyasını import et
import { IoMusicalNotes } from "react-icons/io5";


function RecordButton({ onClick, pressed }) {
  const buttonClass = pressed ? "buttonPressed" : "buttonIdle";
  const innerClass = pressed ? "innerPressed" : "innerIdle";

  return (
      <div className={`buttonBase ${buttonClass}`} onClick={onClick}>
          <button className={`innerBase ${innerClass}`}>
              <IoMusicalNotes className="icon" />
          </button>
      </div>
  );
}


export default RecordButton;