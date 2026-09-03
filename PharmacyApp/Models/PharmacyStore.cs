namespace PharmacyApp.Models;

public sealed class PharmacyStore
{
    public List<Medicine> Medicines { get; set; } = [];
    public List<SaleRecord> Sales { get; set; } = [];
}
