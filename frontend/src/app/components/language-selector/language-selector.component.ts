import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { languages } from '../../app.constants';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSelectorComponent implements OnInit {
  languageForm: UntypedFormGroup;
  languages = languages;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private formBuilder: UntypedFormBuilder,
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.languageForm = this.formBuilder.group({
      language: ['en']
    });
    
    // Check if we're in development mode
    const hostname = this.document.location.hostname;
    const isDevelopment = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.match(/^192\.168\.\d+\.\d+$/) ||
                          hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
                          hostname.includes('localhost');
    
    if (isDevelopment) {
      // In development, check for saved preference in localStorage
      const savedLanguage = localStorage.getItem('preferred-language');
      if (savedLanguage) {
        this.languageForm.get('language').setValue(savedLanguage);
      } else {
        this.languageForm.get('language').setValue(this.languageService.getLanguage());
      }
    } else {
      // In production, use the actual language from the service
      this.languageForm.get('language').setValue(this.languageService.getLanguage());
    }
  }

  changeLanguage() {
    const newLang = this.languageForm.get('language').value;
    this.languageService.setLanguage(newLang);
    
    // Check if we're in development mode (localhost or IP addresses)
    const hostname = this.document.location.hostname;
    const isDevelopment = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.match(/^192\.168\.\d+\.\d+$/) ||
                          hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
                          hostname.includes('localhost');
    
    if (isDevelopment) {
      // In development, store the preference and show feedback
      const selectedLanguage = this.languages.find(l => l.code === newLang);
      console.log(`Language preference set to: ${selectedLanguage?.name} (${newLang})`);
      
      // Store the language preference in localStorage for persistence
      localStorage.setItem('preferred-language', newLang);
      
      // Show a subtle notification instead of an alert
      this.showLanguageNotification(selectedLanguage?.name || newLang);
      
      // Keep the current URL without language prefix in development
      // The language preference is saved and will be used in production
    } else {
      // In production, use URL-based language switching
      const rawUrlPath = this.languageService.stripLanguageFromUrl(null);
      this.document.location.href = (newLang !== 'en' ? `/${newLang}` : '') + rawUrlPath;
    }
  }
  
  private showLanguageNotification(languageName: string) {
    // Create a temporary notification element
    const notification = this.document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 9999;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = `Language set to ${languageName} (will apply in production)`;
    
    // Add animation styles
    const style = this.document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    this.document.head.appendChild(style);
    
    // Add notification to page
    this.document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        this.document.body.removeChild(notification);
        this.document.head.removeChild(style);
      }, 300);
    }, 3000);
  }
}
