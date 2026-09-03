using System.ComponentModel.DataAnnotations;

namespace PharmacyApp.Models;

public sealed class CreateMedicineRequest
{
    [Required, StringLength(150)] public string FullName { get; set; } = string.Empty;
    [StringLength(1000)] public string Notes { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    [Range(0, int.MaxValue)] public int Quantity { get; set; }
    [Range(0.01, 999999.99)] public decimal Price { get; set; }
    [Required, StringLength(100)] public string Brand { get; set; } = string.Empty;
}
