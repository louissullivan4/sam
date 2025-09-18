# Dev README

## Firebase Operations

1. Login

```bash
firebase login
```

2. Deploy rules to firestore

```bash
firebase deploy --only firestore:rules --project prod
```

3. Deploy build to firebase

```bash
firebase deploy --only hosting:prod --project prod
```
