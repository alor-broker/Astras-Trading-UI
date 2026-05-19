import {InjectionToken} from '@angular/core';

export interface FirebaseMessagingConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const FIREBASE_MESSAGING_CONFIG = new InjectionToken<FirebaseMessagingConfig>('FirebaseMessagingConfig');
