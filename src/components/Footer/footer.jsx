import React from "react";
import "./footer.css"; // CSS dosyasını import et
import socials from "../../data/socials";


function Footer() {
  return (
    <footer className="container">
      <div className="socialsContainer">
        {socials.map(({ title, url, Icon }) => (
          <a
            key={title}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            <Icon className="icon" />
          </a>
        ))}
      </div>
      <div>
        From 22 with love
        <a
          className="author"
          target="_blank"
          rel="noopener noreferrer"
          href="null"
        >
          Emir Göç
        </a>
      </div>
    </footer>
  );
}

export default Footer;
