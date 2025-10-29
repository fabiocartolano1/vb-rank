import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Equipe } from '../models/equipe.model';
import { Match } from '../models/match.model';
import { Classement } from '../models/classement.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private firestore = inject(Firestore);

  getEquipes(): Observable<Equipe[]> {
    const equipesCollection = collection(this.firestore, 'equipes');
    return collectionData(equipesCollection, { idField: 'id' }) as Observable<Equipe[]>;
  }

  getMatchs(): Observable<Match[]> {
    const matchsCollection = collection(this.firestore, 'matchs');
    // Pas d'orderBy multiple pour éviter le besoin d'index composite
    // Le tri sera fait côté client dans le composant
    return collectionData(matchsCollection, { idField: 'id' }) as Observable<Match[]>;
  }

  getClassement(): Observable<Classement[]> {
    const classementCollection = collection(this.firestore, 'classement');
    const classementQuery = query(classementCollection, orderBy('rang'));
    return collectionData(classementQuery, { idField: 'id' }) as Observable<Classement[]>;
  }
}
