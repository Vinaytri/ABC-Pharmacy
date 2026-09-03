using System.Text.Json;
using PharmacyApp.Models;

namespace PharmacyApp.Services;

public sealed class JsonPharmacyRepository
{
    private readonly string _path;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public JsonPharmacyRepository(IWebHostEnvironment environment)
    {
        _path = Path.Combine(environment.ContentRootPath, "Data", "pharmacy-data.json");
    }

    public async Task<IReadOnlyList<Medicine>> GetMedicinesAsync(string? search)
    {
        var store = await ReadAsync();
        IEnumerable<Medicine> medicines = store.Medicines;
        if (!string.IsNullOrWhiteSpace(search))
            medicines = medicines.Where(m => m.FullName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase));
        return medicines.OrderBy(m => m.ExpiryDate).ThenBy(m => m.FullName).ToList();
    }

    public async Task<Medicine> AddMedicineAsync(CreateMedicineRequest request)
    {
        await _lock.WaitAsync();
        try
        {
            var store = await ReadUnsafeAsync();
            var medicine = new Medicine
            {
                FullName = request.FullName.Trim(), Notes = request.Notes.Trim(), ExpiryDate = request.ExpiryDate.Date,
                Quantity = request.Quantity, Price = decimal.Round(request.Price, 2), Brand = request.Brand.Trim()
            };
            store.Medicines.Add(medicine);
            await WriteUnsafeAsync(store);
            return medicine;
        }
        finally { _lock.Release(); }
    }

    public async Task<(SaleRecord? Sale, string? Error)> AddSaleAsync(CreateSaleRequest request)
    {
        await _lock.WaitAsync();
        try
        {
            var store = await ReadUnsafeAsync();
            var medicine = store.Medicines.SingleOrDefault(m => m.Id == request.MedicineId);
            if (medicine is null) return (null, "Medicine was not found.");
            if (medicine.Quantity < request.Quantity) return (null, "Not enough stock available for this sale.");
            medicine.Quantity -= request.Quantity;
            var sale = new SaleRecord { MedicineId = medicine.Id, MedicineName = medicine.FullName, Quantity = request.Quantity, UnitPrice = medicine.Price };
            store.Sales.Add(sale);
            await WriteUnsafeAsync(store);
            return (sale, null);
        }
        finally { _lock.Release(); }
    }

    public async Task<IReadOnlyList<SaleRecord>> GetSalesAsync() => (await ReadAsync()).Sales.OrderByDescending(s => s.SoldAt).ToList();

    private async Task<PharmacyStore> ReadAsync()
    {
        await _lock.WaitAsync();
        try { return await ReadUnsafeAsync(); }
        finally { _lock.Release(); }
    }

    private async Task<PharmacyStore> ReadUnsafeAsync()
    {
        if (!File.Exists(_path)) return new PharmacyStore();
        await using var stream = File.OpenRead(_path);
        return await JsonSerializer.DeserializeAsync<PharmacyStore>(stream, _jsonOptions) ?? new PharmacyStore();
    }

    private async Task WriteUnsafeAsync(PharmacyStore store)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var temporary = _path + ".tmp";
        await using (var stream = File.Create(temporary))
            await JsonSerializer.SerializeAsync(stream, store, _jsonOptions);
        File.Move(temporary, _path, true);
    }
}
