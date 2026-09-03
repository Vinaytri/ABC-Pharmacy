using System.ComponentModel.DataAnnotations;

namespace PharmacyApp.Models;

public sealed class CreateSaleRequest
{
    [Required] public Guid MedicineId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}
