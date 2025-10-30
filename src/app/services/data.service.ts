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

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private firestore = inject(Firestore);

  getEquipes(): Observable<Equipe[]> {
    const equipesCollection = collection(this.firestore, 'equipes');
    const equipesQuery = query(equipesCollection, orderBy('rang'));
    return collectionData(equipesQuery, { idField: 'id' }) as Observable<Equipe[]>;
  }

  getMatchs(): Observable<Match[]> {
    const matchsCollection = collection(this.firestore, 'matchs');
    // Pas d'orderBy multiple pour éviter le besoin d'index composite
    // Le tri sera fait côté client dans le composant
    return collectionData(matchsCollection, { idField: 'id' }) as Observable<Match[]>;
  }
}
