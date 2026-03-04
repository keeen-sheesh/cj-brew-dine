<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIngredientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()?->hasAnyRole(['Admin', 'Manager', 'Kitchen']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:ingredients,name'],
            'unit' => ['required', 'string', 'max:50'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'cost_per_unit' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Ingredient name is required',
            'name.unique' => 'An ingredient with this name already exists',
            'unit.required' => 'Unit of measurement is required',
            'quantity.required' => 'Current quantity is required',
            'min_stock.required' => 'Minimum stock threshold is required',
            'cost_per_unit.required' => 'Cost per unit is required',
        ];
    }
}
