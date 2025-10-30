import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
} from '@angular/fire/firestore';
import { Equipe } from '../models/equipe.model';
import { Match } from '../models/match.model';

@Injectable({
  providedIn: 'root',
})
export class DataImportService {
  private firestore = inject(Firestore);

  // Données des équipes avec logos et statistiques de classement
  private equipes: Equipe[] = [
    { nom: 'Narbonne Volley 4', logoUrl: 'https://ui-avatars.com/api/?name=NV&background=1e40af&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 1, points: 12, joues: 4, gagnes: 4, perdus: 3, setsPour: 12, setsContre: 1 },
    { nom: 'Le Crès Volley-Ball 2', logoUrl: 'https://ui-avatars.com/api/?name=LC&background=16a34a&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 2, points: 11, joues: 4, gagnes: 4, perdus: 3, setsPour: 12, setsContre: 2 },
    { nom: 'Sète Volley-Ball Club 2', logoUrl: 'https://ui-avatars.com/api/?name=SV&background=dc2626&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 3, points: 7, joues: 4, gagnes: 3, perdus: 1, setsPour: 9, setsContre: 7 },
    { nom: 'Gazelec Béziers Maraussan V.B', logoUrl: 'https://ui-avatars.com/api/?name=GB&background=ea580c&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 4, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 8, setsContre: 6 },
    { nom: 'Claira Salanque Volley-Ball', logoUrl: 'https://ui-avatars.com/api/?name=CS&background=7c3aed&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 5, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 6, setsContre: 7 },
    { nom: 'VBC Clermontais 2', logoUrl: 'https://ui-avatars.com/api/?name=VC&background=0891b2&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 6, points: 4, joues: 4, gagnes: 1, perdus: 3, setsPour: 6, setsContre: 10 },
    { nom: 'Volley Ball St Estève', logoUrl: 'https://ui-avatars.com/api/?name=VE&background=c026d3&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 7, points: 4, joues: 4, gagnes: 1, perdus: 3, setsPour: 5, setsContre: 9 },
    { nom: 'Nîmes Volley-Ball 2', logoUrl: 'https://ui-avatars.com/api/?name=NM&background=ca8a04&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 8, points: 4, joues: 4, gagnes: 1, perdus: 3, setsPour: 5, setsContre: 10 },
    { nom: 'Mende Lozère Volley-Ball 2', logoUrl: 'https://ui-avatars.com/api/?name=ML&background=059669&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 9, points: 3, joues: 4, gagnes: 1, perdus: 3, setsPour: 4, setsContre: 9 },
    { nom: 'Saint-Gély Volley-Ball 2', logoUrl: 'https://ui-avatars.com/api/?name=SG&background=be123c&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-m', rang: 10, points: 3, joues: 4, gagnes: 1, perdus: 3, setsPour: 4, setsContre: 10 },
  ];

  // Données des matchs (90 matchs sur 18 journées)
  private matchs: Match[] = [
    // Journée 1
    { championnatId: 'regionale-2-m', journee: 1, date: '2025-09-20', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Mende Lozère Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['28:26', '27:25', '21:25', '25:17'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 1, date: '2025-09-20', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Nîmes Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:20', '25:19', '26:24'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 1, date: '2025-09-20', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Le Crès Volley-Ball 2', scoreDomicile: 0, scoreExterieur: 3, detailSets: ['19:25', '17:25', '21:25'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 1, date: '2025-09-20', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Gazelec Béziers Maraussan V.B', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['25:23', '25:20', '23:25', '25:22'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 1, date: '2025-09-20', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Sète Volley-Ball Club 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:17', '25:23', '26:24'], statut: 'termine' },

    // Journée 2
    { championnatId: 'regionale-2-m', journee: 2, date: '2025-09-27', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Mende Lozère Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:18', '25:18', '25:16'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 2, date: '2025-09-27', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Claira Salanque Volley-Ball', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:18', '25:19', '25:15'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 2, date: '2025-09-27', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'VBC Clermontais 2', scoreDomicile: 1, scoreExterieur: 3, detailSets: ['25:27', '25:21', '22:25', '26:28'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 2, date: '2025-09-27', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Volley Ball St Estève', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:18', '25:16', '25:19'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 2, date: '2025-09-28', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Saint-Gély Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['20:25', '25:14', '25:23', '25:19'], statut: 'termine' },

    // Journée 3
    { championnatId: 'regionale-2-m', journee: 3, date: '2025-10-04', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Nîmes Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:22', '25:21', '27:25'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 3, date: '2025-10-04', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Le Crès Volley-Ball 2', scoreDomicile: 0, scoreExterieur: 3, detailSets: ['22:25', '15:25', '22:25'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 3, date: '2025-10-04', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Gazelec Béziers Maraussan V.B', scoreDomicile: 0, scoreExterieur: 3, detailSets: ['17:25', '19:25', '25:27'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 3, date: '2025-10-04', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Sète Volley-Ball Club 2', scoreDomicile: 2, scoreExterieur: 3, detailSets: ['25:15', '19:25', '25:20', '23:25', '13:15'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 3, date: '2025-10-04', heure: '20:45', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Narbonne Volley 4', scoreDomicile: 0, scoreExterieur: 3, detailSets: ['15:25', '25:27', '15:25'], statut: 'termine' },

    // Journée 4
    { championnatId: 'regionale-2-m', journee: 4, date: '2025-10-18', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Mende Lozère Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:13', '25:11', '25:8'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 4, date: '2025-10-18', heure: '18:45', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'VBC Clermontais 2', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['25:18', '25:12', '24:26', '25:22'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 4, date: '2025-10-18', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Volley Ball St Estève', scoreDomicile: 3, scoreExterieur: 2, detailSets: ['25:22', '21:25', '23:25', '25:19', '15:9'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 4, date: '2025-10-18', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Saint-Gély Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:20', '25:11', '25:16'], statut: 'termine' },
    { championnatId: 'regionale-2-m', journee: 4, date: '2025-10-18', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Nîmes Volley-Ball 2', scoreDomicile: 3, scoreExterieur: 2, detailSets: ['25:23', '25:27', '17:25', '31:29', '15:9'], statut: 'termine' },

    // Journée 5
    { championnatId: 'regionale-2-m', journee: 5, date: '2025-11-15', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 5, date: '2025-11-16', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 5, date: '2025-11-15', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 5, date: '2025-11-15', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 5, date: '2025-11-15', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },

    // Journée 6
    { championnatId: 'regionale-2-m', journee: 6, date: '2025-11-22', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 6, date: '2025-11-22', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 6, date: '2025-11-22', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 6, date: '2025-11-22', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 6, date: '2025-11-22', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },

    // Journée 7
    { championnatId: 'regionale-2-m', journee: 7, date: '2025-12-06', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 7, date: '2025-12-06', heure: '18:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 7, date: '2025-12-07', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 7, date: '2025-12-06', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 7, date: '2025-12-06', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },

    // Journée 8
    { championnatId: 'regionale-2-m', journee: 8, date: '2025-12-13', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 8, date: '2025-12-13', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 8, date: '2025-12-13', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 8, date: '2025-12-13', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 8, date: '2025-12-13', heure: '20:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },

    // Journée 9
    { championnatId: 'regionale-2-m', journee: 9, date: '2026-01-10', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 9, date: '2026-01-10', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 9, date: '2026-01-10', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 9, date: '2026-01-11', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 9, date: '2026-01-10', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },

    // Journée 10
    { championnatId: 'regionale-2-m', journee: 10, date: '2026-01-24', heure: '17:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 10, date: '2026-01-25', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 10, date: '2026-01-24', heure: '18:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 10, date: '2026-01-24', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 10, date: '2026-01-24', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },

    // Journée 11
    { championnatId: 'regionale-2-m', journee: 11, date: '2026-01-31', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 11, date: '2026-01-31', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 11, date: '2026-01-31', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 11, date: '2026-01-31', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 11, date: '2026-01-31', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },

    // Journée 12
    { championnatId: 'regionale-2-m', journee: 12, date: '2026-02-15', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 12, date: '2026-02-14', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 12, date: '2026-02-14', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 12, date: '2026-02-14', heure: '20:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 12, date: '2026-02-14', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },

    // Journée 13
    { championnatId: 'regionale-2-m', journee: 13, date: '2026-03-14', heure: '17:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 13, date: '2026-03-14', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 13, date: '2026-03-14', heure: '17:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 13, date: '2026-03-14', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 13, date: '2026-03-15', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },

    // Journée 14
    { championnatId: 'regionale-2-m', journee: 14, date: '2026-03-21', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 14, date: '2026-03-21', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 14, date: '2026-04-04', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 14, date: '2026-03-21', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 14, date: '2026-03-21', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },

    // Journée 15
    { championnatId: 'regionale-2-m', journee: 15, date: '2026-03-28', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 15, date: '2026-03-28', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 15, date: '2026-03-28', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 15, date: '2026-03-29', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 15, date: '2026-03-28', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },

    // Journée 16
    { championnatId: 'regionale-2-m', journee: 16, date: '2026-04-11', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 16, date: '2026-04-11', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 16, date: '2026-04-11', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 16, date: '2026-04-11', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 16, date: '2026-04-11', heure: '20:30', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },

    // Journée 17
    { championnatId: 'regionale-2-m', journee: 17, date: '2026-04-18', heure: '20:00', equipeDomicile: 'Mende Lozère Volley-Ball 2', equipeExterieur: 'Volley Ball St Estève', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 17, date: '2026-04-18', heure: '17:30', equipeDomicile: 'Saint-Gély Volley-Ball 2', equipeExterieur: 'VBC Clermontais 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 17, date: '2026-04-19', heure: '11:00', equipeDomicile: 'Nîmes Volley-Ball 2', equipeExterieur: 'Claira Salanque Volley-Ball', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 17, date: '2026-04-18', heure: '21:00', equipeDomicile: 'Le Crès Volley-Ball 2', equipeExterieur: 'Narbonne Volley 4', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 17, date: '2026-04-18', heure: '21:00', equipeDomicile: 'Gazelec Béziers Maraussan V.B', equipeExterieur: 'Sète Volley-Ball Club 2', statut: 'a_venir' },

    // Journée 18
    { championnatId: 'regionale-2-m', journee: 18, date: '2026-05-09', heure: '17:00', equipeDomicile: 'Sète Volley-Ball Club 2', equipeExterieur: 'Mende Lozère Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 18, date: '2026-05-09', heure: '18:00', equipeDomicile: 'Narbonne Volley 4', equipeExterieur: 'Gazelec Béziers Maraussan V.B', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 18, date: '2026-05-09', heure: '20:00', equipeDomicile: 'Claira Salanque Volley-Ball', equipeExterieur: 'Le Crès Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 18, date: '2026-05-09', heure: '18:00', equipeDomicile: 'VBC Clermontais 2', equipeExterieur: 'Nîmes Volley-Ball 2', statut: 'a_venir' },
    { championnatId: 'regionale-2-m', journee: 18, date: '2026-05-09', heure: '20:00', equipeDomicile: 'Volley Ball St Estève', equipeExterieur: 'Saint-Gély Volley-Ball 2', statut: 'a_venir' },
  ];

  async importAllData() {
    try {
      console.log('Début de l\'importation des données...');

      // 1. Vider les collections existantes
      await this.clearCollection('equipes');
      await this.clearCollection('matchs');
      await this.clearCollection('classement');

      // 2. Importer les équipes (avec les données de classement intégrées)
      console.log('Importation des équipes...');
      for (const equipe of this.equipes) {
        await addDoc(collection(this.firestore, 'equipes'), equipe);
      }
      console.log(`${this.equipes.length} équipes importées`);

      // 3. Importer les matchs
      console.log('Importation des matchs...');
      for (const match of this.matchs) {
        await addDoc(collection(this.firestore, 'matchs'), match);
      }
      console.log(`${this.matchs.length} matchs importés`);

      console.log('Importation terminée avec succès !');
      return {
        success: true,
        equipes: this.equipes.length,
        matchs: this.matchs.length,
      };
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      throw error;
    }
  }

  private async clearCollection(collectionName: string) {
    const querySnapshot = await getDocs(
      collection(this.firestore, collectionName)
    );
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteDoc(doc(this.firestore, collectionName, docSnapshot.id))
    );
    await Promise.all(deletePromises);
    console.log(`Collection ${collectionName} vidée`);
  }
}
