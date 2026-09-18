import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import CityDropdown from '@components/weather/CityDropdown';
import * as api from '@services/api';
import type { City } from '@types';

vi.mock('@services/api', async () => {
  const actual = await vi.importActual<typeof import('@services/api')>('@services/api');
  return {
    ...actual,
    getCities: vi.fn(),
  };
});

const mockCitiesList: City[] = [
  { id: 1, name: 'Tokyo', countryCode: 'JP', latitude: 35.6895, longitude: 139.6917, isActive: true },
  { id: 2, name: 'London', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, isActive: true },
  { id: 3, name: 'Paris', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, isActive: true },
  { id: 4, name: 'New York', countryCode: 'US', latitude: 40.7128, longitude: -74.006, isActive: true },
];

describe('CityDropdown Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCities).mockResolvedValue(mockCitiesList);
  });

  it('renders combobox input and displays cities on click', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(
      <CityDropdown
        cities={mockCitiesList}
        featuredCities={[]}
        selectedCity="Tokyo"
        onSelectCity={handleSelect}
      />
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('placeholder', 'Tokyo...');

    // Open dropdown
    fireEvent.click(combobox);

    expect(screen.getByRole('option', { name: /London/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Paris/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /New York/i })).toBeInTheDocument();
  });

  it('filters cities dynamically when typing in search input', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CityDropdown
        cities={mockCitiesList}
        featuredCities={[]}
        selectedCity=""
        onSelectCity={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox');
    await user.type(combobox, 'Lon');

    expect(screen.getByRole('option', { name: /London/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Tokyo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Paris/i })).not.toBeInTheDocument();
  });

  it('fires the onSelectCity change handler when a city option is clicked', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(
      <CityDropdown
        cities={mockCitiesList}
        featuredCities={[]}
        selectedCity=""
        onSelectCity={handleSelect}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    const londonOption = screen.getByRole('option', { name: /London/i });
    fireEvent.click(londonOption);

    expect(handleSelect).toHaveBeenCalledWith('London');
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it('fetches and renders cities asynchronously via useCities when cities prop is omitted', async () => {
    vi.mocked(api.getCities).mockResolvedValue(mockCitiesList);

    const handleSelect = vi.fn();
    renderWithProviders(<CityDropdown featuredCities={[]} onSelectCity={handleSelect} />);

    // Combobox appears
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    // Waits for TanStack Query to resolve getCities and render the options
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /London/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('option', { name: /Paris/i }));
    expect(handleSelect).toHaveBeenCalledWith('Paris');
  });

  it('navigates options via keyboard ArrowDown and Enter to select', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(
      <CityDropdown
        cities={mockCitiesList}
        featuredCities={[]}
        selectedCity=""
        onSelectCity={handleSelect}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.focus(combobox);

    // Down arrow opens and moves highlight, Enter commits selection
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalled();
  });
});
