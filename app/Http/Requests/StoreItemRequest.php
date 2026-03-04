<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'unique:items,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required_if:pricing_type,single', 'nullable', 'numeric', 'min:0'],
            'price_solo' => ['nullable', 'numeric', 'min:0'],
            'price_whole' => ['nullable', 'numeric', 'min:0'],
            'pricing_type' => ['required', 'in:single,dual'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'is_available' => ['boolean'],
            'is_featured' => ['boolean'],
            'has_sizes' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Item name is required',
            'name.unique' => 'An item with this name already exists',
            'category_id.required' => 'Please select a category',
            'category_id.exists' => 'The selected category is invalid',
            'stock_quantity.required' => 'Stock quantity is required',
            'low_stock_threshold.required' => 'Low stock threshold is required',
        ];
    }
}
