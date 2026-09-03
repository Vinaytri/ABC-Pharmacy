# ABC Pharmacy

A .NET 8 Web API and React single-page application for managing pharmacy stock and medicine sales. Data is persisted in `PharmacyApp/Data/pharmacy-data.json`.

## Run locally

```powershell
dotnet run --project PharmacyApp/PharmacyApp.csproj
```

Open the URL printed by the command (usually `http://localhost:5000`).

## Included features

- Medicine catalogue with name search
- Add a medicine with all requested attributes
- Red rows for medicines expiring in fewer than 30 days
- Yellow rows for quantities below 10 (red takes precedence when both apply)
- Sale recording, including stock validation and automatic quantity deduction
- JSON-backed server-side storage and sale history
