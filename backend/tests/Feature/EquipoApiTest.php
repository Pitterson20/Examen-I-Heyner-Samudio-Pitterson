<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $datos = [
        'codigo' => 'EQ-9001',
        'nombre' => 'Equipo de prueba',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => now()->subDay()->toDateString(),
        'costo_interno' => 1500,
    ];

    $response = $this->postJson('/api/equipos', $datos);

    $equipo = Equipo::where('codigo', 'EQ-9001')->firstOrFail();

    $response->assertCreated()
        ->assertHeader('Location', route('equipos.show', $equipo))
        ->assertJsonPath('data.codigo', 'EQ-9001');

    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-9001']);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $response = $this->postJson('/api/equipos', [
        'codigo' => 'ABC',
        'nombre' => 'x',
        'categoria_id' => 9999,
        'estado' => 'prestado',
        'fecha_adquisicion' => now()->addDay()->toDateString(),
        'costo_interno' => -1,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'estado',
            'fecha_adquisicion',
            'costo_interno',
        ])
        ->assertJsonPath('errors.codigo.0', 'El código debe tener el formato EQ-0000.');
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $response = $this->deleteJson("/api/equipos/{$equipo->id}");

    $response->assertStatus(409)
        ->assertJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo' => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});
