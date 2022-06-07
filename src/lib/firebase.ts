/* eslint-disable max-classes-per-file */
import { deleteApp, FirebaseApp, initializeApp } from 'firebase/app'
import {
  doc,
  Firestore,
  getFirestore,
  writeBatch,
  getDocs,
  query,
  collection,
  orderBy,
  limit,
  setDoc,
} from 'firebase/firestore'

import { config } from '../app.config'
import { ArbDocument } from '../types'

export class FirebaseClient {
  app: FirebaseApp
  db: Firestore
  collectionName = config.COLLECTION_NAME

  constructor() {
    this.app = initializeApp({
      apiKey: config.FIREBASE_API_KEY,
      authDomain: config.FIREBASE_AUTH_DOMAIN,
      projectId: config.FIREBASE_PROJECT_ID,
      storageBucket: config.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.FIREBASE_SENDER_ID,
      appId: config.FIREBASE_APP_ID,
      measurementId: config.FIREBASE_MEASUREMENT_ID,
    })
    this.db = getFirestore(this.app)
  }

  initBatchWrite() {
    const batchWrite = writeBatch(this.db)

    return {
      add: (data: ArbDocument) => {
        const { id, ...value } = data

        const ref = doc(this.db, this.collectionName, id)
        batchWrite.set(ref, value)
      },
      save: async () => {
        await batchWrite.commit()
      },
    }
  }

  async insertArb(data: ArbDocument) {
    const { id, ...value } = data

    const newArbDocument = doc(this.db, this.collectionName, id)
    await setDoc(newArbDocument, value)
  }

  async getLastArb(): Promise<ArbDocument | null> {
    const getLastQuery = query(collection(this.db, this.collectionName), orderBy('executedAt', 'desc'), limit(1))
    const querySnapshot = await getDocs(getLastQuery)

    if (!querySnapshot.docs.length) {
      return null
    }

    const [lastInsertedDoc] = querySnapshot.docs
    const lastArb = lastInsertedDoc.data() as Omit<ArbDocument, 'id'>

    return {
      id: lastInsertedDoc.id,
      ...lastArb,
    }
  }

  async disconnect() {
    await deleteApp(this.app)
  }
}
