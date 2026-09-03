using PharmacyApp.Models;
using PharmacyApp.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<JsonPharmacyRepository>();
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/medicines", async (string? search, JsonPharmacyRepository repository) =>
    Results.Ok(await repository.GetMedicinesAsync(search)));

app.MapPost("/api/medicines", async (CreateMedicineRequest request, JsonPharmacyRepository repository) =>
{
    if (request.ExpiryDate == default) return Results.ValidationProblem(new Dictionary<string, string[]> { ["expiryDate"] = ["Expiry date is required."] });
    var medicine = await repository.AddMedicineAsync(request);
    return Results.Created($"/api/medicines/{medicine.Id}", medicine);
});

app.MapGet("/api/sales", async (JsonPharmacyRepository repository) => Results.Ok(await repository.GetSalesAsync()));
app.MapPost("/api/sales", async (CreateSaleRequest request, JsonPharmacyRepository repository) =>
{
    var (sale, error) = await repository.AddSaleAsync(request);
    return sale is null ? Results.BadRequest(new { message = error }) : Results.Created($"/api/sales/{sale.Id}", sale);
});

app.MapFallbackToFile("index.html");
app.Run();
