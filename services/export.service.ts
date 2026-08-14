import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { exportRepository, ExportFilters } from '@/repositories/export.repository';
import { adminService } from '@/services/admin.service';
import { BadRequestError } from '@/lib/errors';

export type ExportType = 'bookings' | 'customers' | 'cooks' | 'payments' | 'reviews' | 'services' | 'cities';
export type ExportFormat = 'xlsx' | 'csv';

export interface GoogleSheetsExportRequest {
  spreadsheetId: string;
  sheetName: string;
  data: Record<string, unknown>[];
}

export interface IGoogleSheetsExporter {
  exportToGoogleSheets(request: GoogleSheetsExportRequest): Promise<{ success: boolean; updatedRows: number }>;
}

export class GoogleSheetsExporterSkeleton implements IGoogleSheetsExporter {
  async exportToGoogleSheets(request: GoogleSheetsExportRequest): Promise<{ success: boolean; updatedRows: number }> {
    // Interface skeleton for future Google Sheets API integration
    console.log(`[GoogleSheetsSkeleton] Pushing ${request.data.length} rows to spreadsheet ${request.spreadsheetId} (${request.sheetName})`);
    return {
      success: true,
      updatedRows: request.data.length,
    };
  }
}

export const googleSheetsExporter = new GoogleSheetsExporterSkeleton();

export class ExportService {
  /**
   * Main export orchestrator: validates admin and generates Excel or CSV buffer/string
   */
  async exportData(
    client: SupabaseClient<Database>,
    adminUserId: string,
    type: ExportType,
    format: ExportFormat,
    filters: ExportFilters
  ) {
    // 1. Enforce Admin Security
    await adminService.verifyAdmin(client, adminUserId);

    // 2. Fetch dataset based on entity type
    let rows: Record<string, unknown>[] = [];
    switch (type) {
      case 'bookings':
        rows = (await exportRepository.getBookingsData(client, filters)) as unknown as Record<string, unknown>[];
        break;
      case 'customers':
        rows = (await exportRepository.getCustomersData(client, filters)) as unknown as Record<string, unknown>[];
        break;
      case 'cooks':
        rows = (await exportRepository.getCooksData(client, filters)) as unknown as Record<string, unknown>[];
        break;
      case 'payments':
        rows = (await exportRepository.getPaymentsData(client, filters)) as unknown as Record<string, unknown>[];
        break;
      case 'reviews':
        rows = (await exportRepository.getReviewsData(client, filters)) as unknown as Record<string, unknown>[];
        break;
      case 'services':
        rows = (await exportRepository.getServicesData(client)) as unknown as Record<string, unknown>[];
        break;
      case 'cities':
        rows = (await exportRepository.getCitiesData(client)) as unknown as Record<string, unknown>[];
        break;
      default:
        throw new BadRequestError(`Unsupported export type: ${type}`);
    }

    const flatData = this.flattenData(type, rows);

    // 3. Format as Excel (.xlsx) or CSV
    if (format === 'csv') {
      const csvString = this.generateCSV(flatData);
      return {
        content: Buffer.from(csvString, 'utf-8'),
        contentType: 'text/csv; charset=utf-8',
        filename: `${type}_export_${Date.now()}.csv`,
      };
    } else if (format === 'xlsx') {
      const buffer = await this.generateExcel(type, flatData);
      return {
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${type}_export_${Date.now()}.xlsx`,
      };
    } else {
      throw new BadRequestError(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Flattens nested JSON records into tabular key-value objects
   */
  private flattenData(type: ExportType, rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.map((row) => {
      if (type === 'bookings') {
        const customer = (row.customer || {}) as { full_name?: string; phone?: string; email?: string };
        const cook = (row.cook || {}) as { full_name?: string; phone?: string };
        const service = (row.service || {}) as { name?: string; category?: string };

        return {
          'Booking Number': row.booking_number,
          'Date': row.booking_date,
          'Start Time': row.start_time,
          'Status': row.status,
          'Customer Name': customer.full_name || 'N/A',
          'Customer Phone': customer.phone || 'N/A',
          'Cook Name': cook.full_name || 'Unassigned',
          'Service': service.name || 'N/A',
          'Category': service.category || 'N/A',
          'Duration (Hrs)': row.duration_hours,
          'Guest Count': row.guest_count,
          'Subtotal (₹)': row.subtotal,
          'Tax Amount (₹)': row.tax_amount,
          'Platform Fee (₹)': row.platform_fee,
          'Total Amount (₹)': row.total_amount,
          'Created At': row.created_at,
        };
      }

      if (type === 'customers') {
        const details = (row.customer_details || {}) as {
          dietary_preferences?: string[];
          allergies?: string[];
          house_type?: string;
          kitchen_type?: string;
        };
        return {
          'Customer ID': row.id,
          'Full Name': row.full_name || 'N/A',
          'Email': row.email || 'N/A',
          'Phone': row.phone || 'N/A',
          'Status': row.status,
          'Dietary Preferences': Array.isArray(details.dietary_preferences) ? details.dietary_preferences.join(', ') : 'None',
          'Allergies': Array.isArray(details.allergies) ? details.allergies.join(', ') : 'None',
          'House Type': details.house_type || 'N/A',
          'Kitchen Type': details.kitchen_type || 'N/A',
          'Joined At': row.created_at,
        };
      }

      if (type === 'cooks') {
        const details = (row.cook_details || {}) as {
          bio?: string;
          experience_years?: number;
          speciality?: string[];
          hourly_rate?: number;
          is_verified?: boolean;
          police_verification_status?: string;
        };
        return {
          'Cook ID': row.id,
          'Full Name': row.full_name || 'N/A',
          'Email': row.email || 'N/A',
          'Phone': row.phone || 'N/A',
          'Status': row.status,
          'Experience (Years)': details.experience_years || 0,
          'Specialities': Array.isArray(details.speciality) ? details.speciality.join(', ') : 'General',
          'Hourly Rate (₹)': details.hourly_rate || 0,
          'Is Verified': details.is_verified ? 'Yes' : 'No',
          'Police Verification': details.police_verification_status || 'Pending',
          'Joined At': row.created_at,
        };
      }

      if (type === 'payments') {
        return {
          'Payment ID': row.id,
          'Booking ID': row.booking_id,
          'Customer ID': row.customer_id,
          'Provider': ((row.provider as string) || 'paytm').toUpperCase(),
          'Order ID': (row.provider_order_id as string) || 'N/A',
          'Provider Payment ID': (row.provider_payment_id as string) || 'N/A',
          'Bank Txn ID': (row.bank_txn_id as string) || 'N/A',
          'Amount (₹)': row.amount,
          'Currency': row.currency,
          'Status': row.status,
          'Method': row.method || 'UPI',
          'Refund ID': row.refund_id || 'N/A',
          'Created At': row.created_at,
        };
      }

      if (type === 'reviews') {
        const customer = (row.customer || {}) as { full_name?: string };
        const cook = (row.cook || {}) as { full_name?: string };
        return {
          'Review ID': row.id,
          'Booking ID': row.booking_id,
          'Customer': customer.full_name || 'N/A',
          'Cook': cook.full_name || 'N/A',
          'Rating': row.rating,
          'Comment': row.comment || '',
          'Created At': row.created_at,
        };
      }

      if (type === 'services') {
        return {
          'Service ID': row.id,
          'Name': row.name,
          'Category': row.category,
          'Base Price (₹)': row.base_price,
          'Duration (Hrs)': row.duration_hours,
          'Is Active': row.is_active ? 'Yes' : 'No',
          'Created At': row.created_at,
        };
      }

      if (type === 'cities') {
        return {
          'City ID': row.id,
          'City Name': row.name,
          'State': row.state,
          'Is Active': row.is_active ? 'Yes' : 'No',
          'Created At': row.created_at,
        };
      }

      return row;
    });
  }

  /**
   * Generates formatted Excel workbook buffer using ExcelJS
   */
  private async generateExcel(type: string, data: Record<string, unknown>[]): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheetName = type.charAt(0).toUpperCase() + type.slice(1);
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      worksheet.addRow(['No records found']);
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(arrayBuffer);
    }

    const headers = Object.keys(data[0]);

    // Add Header Row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Freeze top header row
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Add Data Rows
    data.forEach((item) => {
      const rowValues = headers.map((header) => item[header] ?? '');
      worksheet.addRow(rowValues);
    });

    // Format Columns (Auto Width + Padding)
    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : '';
        if (valStr.length > maxLen) maxLen = Math.min(valStr.length + 4, 45);
      });
      column.width = maxLen;
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates RFC-compliant UTF-8 CSV string
   */
  private generateCSV(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const dataLines = data.map((row) =>
      headers.map((h) => escapeCsv(row[h])).join(',')
    );

    return [headerLine, ...dataLines].join('\n');
  }
}

export const exportService = new ExportService();
