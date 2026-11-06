package report

import (
	"fmt"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// GenerateExcel menghasilkan workbook excelize sesuai spesifikasi PRD §6.6.
// excelWriter membungkus excelize.File dengan pola sticky error (idiomatic Go).
// Seluruh operasi penulisan sel dan format diperiksa secara berurutan;
// jika terjadi error, error pertama disimpan dan operasi berikutnya dilewati dengan aman.
type excelWriter struct {
	f   *excelize.File
	err error
}

func (w *excelWriter) SetCellValue(sheet, cell string, value any) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetCellValue(sheet, cell, value)
}

func (w *excelWriter) SetCellStyle(sheet, topLeft, bottomRight string, styleID int) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetCellStyle(sheet, topLeft, bottomRight, styleID)
}

func (w *excelWriter) SetRowHeight(sheet string, row int, height float64) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetRowHeight(sheet, row, height)
}

func (w *excelWriter) SetColWidth(sheet, startCol, endCol string, width float64) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetColWidth(sheet, startCol, endCol, width)
}

func (w *excelWriter) MergeCell(sheet, topLeft, bottomRight string) {
	if w.err != nil {
		return
	}
	w.err = w.f.MergeCell(sheet, topLeft, bottomRight)
}

func (w *excelWriter) SetSheetName(oldName, newName string) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetSheetName(oldName, newName)
}

func (w *excelWriter) NewSheet(name string) {
	if w.err != nil {
		return
	}
	_, w.err = w.f.NewSheet(name)
}

func (w *excelWriter) SetPanes(sheet string, panes *excelize.Panes) {
	if w.err != nil {
		return
	}
	w.err = w.f.SetPanes(sheet, panes)
}

func (w *excelWriter) AutoFilter(sheet, rangeRef string, opts []excelize.AutoFilterOptions) {
	if w.err != nil {
		return
	}
	w.err = w.f.AutoFilter(sheet, rangeRef, opts)
}

func GenerateExcel(rows []ExportPropertyRow, stats *SummaryStats, adminName string, filterDesc string, siteURL string) (*excelize.File, error) {
	f := excelize.NewFile()
	w := &excelWriter{f: f}

	sheet1 := "Daftar Properti"
	sheet2 := "Ringkasan"

	// Rename default sheet
	w.SetSheetName("Sheet1", sheet1)
	w.NewSheet(sheet2)

	// Time in WIB (UTC+7)
	wibLoc := time.FixedZone("WIB", 7*3600)
	nowWIB := time.Now().In(wibLoc)
	dateStr := nowWIB.Format("02/01/2006 15:04 WIB")

	// ==========================================
	// 1. STYLES
	// ==========================================
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Color: "FFFFFF",
			Size:  11,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"0D2B6B"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
			WrapText:   true,
		},
		Border: []excelize.Border{
			{Type: "left", Color: "CBD5E1", Style: 1},
			{Type: "right", Color: "CBD5E1", Style: 1},
			{Type: "top", Color: "CBD5E1", Style: 1},
			{Type: "bottom", Color: "CBD5E1", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	titleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Size:  14,
			Color: "0D2B6B",
		},
	})
	if err != nil {
		return nil, err
	}

	metaStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Size:  10,
			Color: "475569",
		},
	})
	if err != nil {
		return nil, err
	}

	dataStyleWhite, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 10, Color: "0F172A"},
		Alignment: &excelize.Alignment{
			Vertical: "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	dataStyleZebra, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 10, Color: "0F172A"},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"F8FAFC"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Vertical: "center",
		},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	priceStyleWhite, err := f.NewStyle(&excelize.Style{
		CustomNumFmt: &[]string{"#,##0"}[0],
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	priceStyleZebra, err := f.NewStyle(&excelize.Style{
		CustomNumFmt: &[]string{"#,##0"}[0],
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"F8FAFC"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	areaStyleWhite, err := f.NewStyle(&excelize.Style{
		CustomNumFmt: &[]string{"#,##0.00"}[0],
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	areaStyleZebra, err := f.NewStyle(&excelize.Style{
		CustomNumFmt: &[]string{"#,##0.00"}[0],
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"F8FAFC"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	centerStyleWhite, err := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	centerStyleZebra, err := f.NewStyle(&excelize.Style{
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"F8FAFC"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "E2E8F0", Style: 1},
			{Type: "right", Color: "E2E8F0", Style: 1},
			{Type: "top", Color: "E2E8F0", Style: 1},
			{Type: "bottom", Color: "E2E8F0", Style: 1},
		},
	})
	if err != nil {
		return nil, err
	}

	footerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Color: "0F172A",
			Size:  10,
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"E2E8F0"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Vertical: "center",
		},
		Border: []excelize.Border{
			{Type: "top", Color: "0D2B6B", Style: 2},
			{Type: "bottom", Color: "0D2B6B", Style: 2},
		},
	})
	if err != nil {
		return nil, err
	}

	footerPriceStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Color: "0F172A",
			Size:  10,
		},
		CustomNumFmt: &[]string{"#,##0"}[0],
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"E2E8F0"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "right",
			Vertical:   "center",
		},
		Border: []excelize.Border{
			{Type: "top", Color: "0D2B6B", Style: 2},
			{Type: "bottom", Color: "0D2B6B", Style: 2},
		},
	})
	if err != nil {
		return nil, err
	}

	// ==========================================
	// 2. SHEET 1: DAFTAR PROPERTI
	// ==========================================

	// Row 1: Title
	w.MergeCell(sheet1, "A1", "AD1")
	w.SetCellValue(sheet1, "A1", "Laporan Data Properti — MasterPro Real Estate")
	w.SetCellStyle(sheet1, "A1", "AD1", titleStyle)
	w.SetRowHeight(sheet1, 1, 28)

	// Row 2: Metadata Creator
	w.SetCellValue(sheet1, "A2", fmt.Sprintf("Dibuat: %s oleh %s", dateStr, adminName))
	w.SetCellStyle(sheet1, "A2", "AD2", metaStyle)
	w.SetRowHeight(sheet1, 2, 18)

	// Row 3: Filter Summary
	w.SetCellValue(sheet1, "A3", fmt.Sprintf("Filter: %s", filterDesc))
	w.SetCellStyle(sheet1, "A3", "AD3", metaStyle)
	w.SetRowHeight(sheet1, 3, 18)

	// Row 5: Column Headers
	headers := []string{
		"No", "Kode", "Judul", "Jual/Sewa", "Pasar", "Tipe Properti",
		"Provinsi", "Kota", "Kecamatan", "Alamat", "Harga (Rp)", "Periode Sewa",
		"Nego", "LT (m²)", "LB (m²)", "KT", "KM", "Sertifikat", "Furnishing",
		"Status", "Agen", "Kode Agen", "WhatsApp Agen", "Dilihat", "Klik WA",
		"Tayang", "Ditutup", "Dibuat", "Diperbarui", "URL Publik",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 5)
		w.SetCellValue(sheet1, cell, h)
	}
	w.SetCellStyle(sheet1, "A5", "AD5", headerStyle)
	w.SetRowHeight(sheet1, 5, 26)

	// Freeze pane below Row 5
	w.SetPanes(sheet1, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      5,
		TopLeftCell: "A6",
		ActivePane:  "bottomLeft",
	})

	// Fill Data Rows
	var totalActiveSalePrice int64 = 0
	rowStart := 6

	for i, r := range rows {
		rowNum := rowStart + i
		isZebra := (i % 2) == 1

		dStyle := dataStyleWhite
		pStyle := priceStyleWhite
		aStyle := areaStyleWhite
		cStyle := centerStyleWhite
		if isZebra {
			dStyle = dataStyleZebra
			pStyle = priceStyleZebra
			aStyle = areaStyleZebra
			cStyle = centerStyleZebra
		}

		w.SetRowHeight(sheet1, rowNum, 20)

		if r.Status == "Tayang" && r.ListingType == "Jual" {
			totalActiveSalePrice += r.Price
		}

		nego := "Tidak"
		if r.IsPriceNegotiable {
			nego = "Ya"
		}

		var ltVal interface{} = "-"
		if r.LandArea != nil {
			ltVal = *r.LandArea
		}
		var lbVal interface{} = "-"
		if r.BuildingArea != nil {
			lbVal = *r.BuildingArea
		}
		var ktVal interface{} = "-"
		if r.Bedrooms != nil {
			ktVal = *r.Bedrooms
		}
		var kmVal interface{} = "-"
		if r.Bathrooms != nil {
			kmVal = *r.Bathrooms
		}

		publishedStr := "-"
		if r.PublishedAt != nil {
			publishedStr = r.PublishedAt.In(wibLoc).Format("02/01/2006 15:04")
		}
		closedStr := "-"
		if r.ClosedAt != nil {
			closedStr = r.ClosedAt.In(wibLoc).Format("02/01/2006 15:04")
		}
		createdStr := r.CreatedAt.In(wibLoc).Format("02/01/2006 15:04")
		updatedStr := r.UpdatedAt.In(wibLoc).Format("02/01/2006 15:04")

		pubURL := fmt.Sprintf("%s/id/properties/%s", strings.TrimRight(siteURL, "/"), r.Slug)

		// Set values & styles
		w.SetCellValue(sheet1, fmt.Sprintf("A%d", rowNum), i+1)
		w.SetCellStyle(sheet1, fmt.Sprintf("A%d", rowNum), fmt.Sprintf("A%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("B%d", rowNum), r.Code)
		w.SetCellStyle(sheet1, fmt.Sprintf("B%d", rowNum), fmt.Sprintf("B%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("C%d", rowNum), r.Title)
		w.SetCellStyle(sheet1, fmt.Sprintf("C%d", rowNum), fmt.Sprintf("C%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("D%d", rowNum), r.ListingType)
		w.SetCellStyle(sheet1, fmt.Sprintf("D%d", rowNum), fmt.Sprintf("D%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("E%d", rowNum), r.MarketType)
		w.SetCellStyle(sheet1, fmt.Sprintf("E%d", rowNum), fmt.Sprintf("E%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("F%d", rowNum), r.PropertyTypeName)
		w.SetCellStyle(sheet1, fmt.Sprintf("F%d", rowNum), fmt.Sprintf("F%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("G%d", rowNum), r.Province)
		w.SetCellStyle(sheet1, fmt.Sprintf("G%d", rowNum), fmt.Sprintf("G%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("H%d", rowNum), r.City)
		w.SetCellStyle(sheet1, fmt.Sprintf("H%d", rowNum), fmt.Sprintf("H%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("I%d", rowNum), r.District)
		w.SetCellStyle(sheet1, fmt.Sprintf("I%d", rowNum), fmt.Sprintf("I%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("J%d", rowNum), r.Address)
		w.SetCellStyle(sheet1, fmt.Sprintf("J%d", rowNum), fmt.Sprintf("J%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("K%d", rowNum), r.Price)
		w.SetCellStyle(sheet1, fmt.Sprintf("K%d", rowNum), fmt.Sprintf("K%d", rowNum), pStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("L%d", rowNum), r.RentPeriod)
		w.SetCellStyle(sheet1, fmt.Sprintf("L%d", rowNum), fmt.Sprintf("L%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("M%d", rowNum), nego)
		w.SetCellStyle(sheet1, fmt.Sprintf("M%d", rowNum), fmt.Sprintf("M%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("N%d", rowNum), ltVal)
		if r.LandArea != nil {
			w.SetCellStyle(sheet1, fmt.Sprintf("N%d", rowNum), fmt.Sprintf("N%d", rowNum), aStyle)
		} else {
			w.SetCellStyle(sheet1, fmt.Sprintf("N%d", rowNum), fmt.Sprintf("N%d", rowNum), cStyle)
		}

		w.SetCellValue(sheet1, fmt.Sprintf("O%d", rowNum), lbVal)
		if r.BuildingArea != nil {
			w.SetCellStyle(sheet1, fmt.Sprintf("O%d", rowNum), fmt.Sprintf("O%d", rowNum), aStyle)
		} else {
			w.SetCellStyle(sheet1, fmt.Sprintf("O%d", rowNum), fmt.Sprintf("O%d", rowNum), cStyle)
		}

		w.SetCellValue(sheet1, fmt.Sprintf("P%d", rowNum), ktVal)
		w.SetCellStyle(sheet1, fmt.Sprintf("P%d", rowNum), fmt.Sprintf("P%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("Q%d", rowNum), kmVal)
		w.SetCellStyle(sheet1, fmt.Sprintf("Q%d", rowNum), fmt.Sprintf("Q%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("R%d", rowNum), r.Certificate)
		w.SetCellStyle(sheet1, fmt.Sprintf("R%d", rowNum), fmt.Sprintf("R%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("S%d", rowNum), r.Furnishing)
		w.SetCellStyle(sheet1, fmt.Sprintf("S%d", rowNum), fmt.Sprintf("S%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("T%d", rowNum), r.Status)
		w.SetCellStyle(sheet1, fmt.Sprintf("T%d", rowNum), fmt.Sprintf("T%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("U%d", rowNum), r.AgentName)
		w.SetCellStyle(sheet1, fmt.Sprintf("U%d", rowNum), fmt.Sprintf("U%d", rowNum), dStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("V%d", rowNum), r.AgentCode)
		w.SetCellStyle(sheet1, fmt.Sprintf("V%d", rowNum), fmt.Sprintf("V%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("W%d", rowNum), r.AgentWhatsapp)
		w.SetCellStyle(sheet1, fmt.Sprintf("W%d", rowNum), fmt.Sprintf("W%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("X%d", rowNum), r.ViewCount)
		w.SetCellStyle(sheet1, fmt.Sprintf("X%d", rowNum), fmt.Sprintf("X%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("Y%d", rowNum), r.WhatsappClickCount)
		w.SetCellStyle(sheet1, fmt.Sprintf("Y%d", rowNum), fmt.Sprintf("Y%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("Z%d", rowNum), publishedStr)
		w.SetCellStyle(sheet1, fmt.Sprintf("Z%d", rowNum), fmt.Sprintf("Z%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("AA%d", rowNum), closedStr)
		w.SetCellStyle(sheet1, fmt.Sprintf("AA%d", rowNum), fmt.Sprintf("AA%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("AB%d", rowNum), createdStr)
		w.SetCellStyle(sheet1, fmt.Sprintf("AB%d", rowNum), fmt.Sprintf("AB%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("AC%d", rowNum), updatedStr)
		w.SetCellStyle(sheet1, fmt.Sprintf("AC%d", rowNum), fmt.Sprintf("AC%d", rowNum), cStyle)

		w.SetCellValue(sheet1, fmt.Sprintf("AD%d", rowNum), pubURL)
		w.SetCellStyle(sheet1, fmt.Sprintf("AD%d", rowNum), fmt.Sprintf("AD%d", rowNum), dStyle)
	}

	// AutoFilter
	lastDataRow := rowStart + len(rows) - 1
	if len(rows) == 0 {
		lastDataRow = 5
	}
	w.AutoFilter(sheet1, fmt.Sprintf("A5:AD%d", lastDataRow), []excelize.AutoFilterOptions{})

	// Footer Row (Baris Akhir Total)
	footerRow := lastDataRow + 1
	w.SetRowHeight(sheet1, footerRow, 24)

	w.MergeCell(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("J%d", footerRow))
	w.SetCellValue(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("TOTAL: %d LISTING (Total Nilai Properti Tayang Dijual: Rp)", len(rows)))
	w.SetCellStyle(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("J%d", footerRow), footerStyle)

	w.SetCellValue(sheet1, fmt.Sprintf("K%d", footerRow), totalActiveSalePrice)
	w.SetCellStyle(sheet1, fmt.Sprintf("K%d", footerRow), fmt.Sprintf("K%d", footerRow), footerPriceStyle)

	w.MergeCell(sheet1, fmt.Sprintf("L%d", footerRow), fmt.Sprintf("AD%d", footerRow))
	w.SetCellStyle(sheet1, fmt.Sprintf("L%d", footerRow), fmt.Sprintf("AD%d", footerRow), footerStyle)

	// Set Column Widths for Sheet 1
	colWidths := map[string]float64{
		"A":  6,  // No
		"B":  13, // Kode
		"C":  35, // Judul
		"D":  11, // Jual/Sewa
		"E":  11, // Pasar
		"F":  16, // Tipe
		"G":  18, // Provinsi
		"H":  18, // Kota
		"I":  16, // Kecamatan
		"J":  30, // Alamat
		"K":  18, // Harga
		"L":  14, // Periode Sewa
		"M":  8,  // Nego
		"N":  12, // LT
		"O":  12, // LB
		"P":  7,  // KT
		"Q":  7,  // KM
		"R":  12, // Sertifikat
		"S":  16, // Furnishing
		"T":  12, // Status
		"U":  22, // Agen
		"V":  14, // Kode Agen
		"W":  16, // WA Agen
		"X":  10, // Dilihat
		"Y":  10, // Klik WA
		"Z":  18, // Tayang
		"AA": 18, // Ditutup
		"AB": 18, // Dibuat
		"AC": 18, // Diperbarui
		"AD": 40, // URL
	}
	for col, width := range colWidths {
		w.SetColWidth(sheet1, col, col, width)
	}

	// ==========================================
	// 3. SHEET 2: RINGKASAN
	// ==========================================
	w.MergeCell(sheet2, "A1", "H1")
	w.SetCellValue(sheet2, "A1", "Ringkasan & Statistik Data Properti")
	w.SetCellStyle(sheet2, "A1", "H1", titleStyle)
	w.SetRowHeight(sheet2, 1, 26)

	w.SetCellValue(sheet2, "A2", fmt.Sprintf("Data per %s", dateStr))
	w.SetCellStyle(sheet2, "A2", "H2", metaStyle)
	w.SetRowHeight(sheet2, 2, 18)

	// Section 1: Berdasarkan Status
	w.SetCellValue(sheet2, "A4", "1. Rekapitulasi Berdasarkan Status")
	w.SetCellStyle(sheet2, "A4", "A4", titleStyle)

	w.SetCellValue(sheet2, "A5", "Status")
	w.SetCellValue(sheet2, "B5", "Jumlah Listing")
	w.SetCellValue(sheet2, "C5", "Persentase")
	w.SetCellStyle(sheet2, "A5", "C5", headerStyle)
	w.SetRowHeight(sheet2, 5, 22)

	statusData := []struct {
		Label string
		Count int64
	}{
		{"Tayang (Active)", stats.ActiveCount},
		{"Draf (Draft)", stats.DraftCount},
		{"Terjual (Sold)", stats.SoldCount},
		{"Tersewa (Rented)", stats.RentedCount},
		{"Nonaktif (Inactive)", stats.InactiveCount},
	}

	for idx, sd := range statusData {
		rNum := 6 + idx
		pct := "0.0%"
		if stats.TotalCount > 0 {
			pct = fmt.Sprintf("%.1f%%", float64(sd.Count)*100.0/float64(stats.TotalCount))
		}
		st := dataStyleWhite
		if idx%2 == 1 {
			st = dataStyleZebra
		}
		w.SetCellValue(sheet2, fmt.Sprintf("A%d", rNum), sd.Label)
		w.SetCellValue(sheet2, fmt.Sprintf("B%d", rNum), sd.Count)
		w.SetCellValue(sheet2, fmt.Sprintf("C%d", rNum), pct)
		w.SetCellStyle(sheet2, fmt.Sprintf("A%d", rNum), fmt.Sprintf("C%d", rNum), st)
	}

	totStatusRow := 6 + len(statusData)
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", totStatusRow), "Total Listing")
	w.SetCellValue(sheet2, fmt.Sprintf("B%d", totStatusRow), stats.TotalCount)
	w.SetCellValue(sheet2, fmt.Sprintf("C%d", totStatusRow), "100.0%")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", totStatusRow), fmt.Sprintf("C%d", totStatusRow), footerStyle)

	// Section 2: Berdasarkan Transaksi & Tipe
	curRow := totStatusRow + 2
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "2. Rekapitulasi Transaksi (Jual / Sewa)")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Jenis Transaksi")
	w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Jumlah Listing")
	w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Persentase")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), headerStyle)

	txData := []struct {
		Label string
		Count int64
	}{
		{"Properti Dijual (Sale)", stats.SaleCount},
		{"Properti Disewa (Rent)", stats.RentCount},
	}
	for idx, td := range txData {
		curRow++
		pct := "0.0%"
		if stats.TotalCount > 0 {
			pct = fmt.Sprintf("%.1f%%", float64(td.Count)*100.0/float64(stats.TotalCount))
		}
		st := dataStyleWhite
		if idx%2 == 1 {
			st = dataStyleZebra
		}
		w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), td.Label)
		w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), td.Count)
		w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), pct)
		w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), st)
	}

	// Section 3: Berdasarkan Tipe Properti
	curRow += 2
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "3. Rekapitulasi Tipe Properti")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Tipe Properti")
	w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Jumlah Listing")
	w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Persentase")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), headerStyle)

	for idx, tc := range stats.TypeCounts {
		curRow++
		pct := "0.0%"
		if stats.TotalCount > 0 {
			pct = fmt.Sprintf("%.1f%%", float64(tc.Count)*100.0/float64(stats.TotalCount))
		}
		st := dataStyleWhite
		if idx%2 == 1 {
			st = dataStyleZebra
		}
		w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), tc.TypeName)
		w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), tc.Count)
		w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), pct)
		w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), st)
	}

	// Section 4: Performa Per Agen
	curRow += 2
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "4. Rekapitulasi Performa Mitra Agen")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Nama Agen")
	w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Kode Agen")
	w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Tayang")
	w.SetCellValue(sheet2, fmt.Sprintf("D%d", curRow), "Terjual")
	w.SetCellValue(sheet2, fmt.Sprintf("E%d", curRow), "Tersewa")
	w.SetCellValue(sheet2, fmt.Sprintf("F%d", curRow), "Draf")
	w.SetCellValue(sheet2, fmt.Sprintf("G%d", curRow), "Total Listing")
	w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("G%d", curRow), headerStyle)

	for idx, as := range stats.AgentStats {
		curRow++
		st := dataStyleWhite
		cSt := centerStyleWhite
		if idx%2 == 1 {
			st = dataStyleZebra
			cSt = centerStyleZebra
		}
		w.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), as.AgentName)
		w.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), st)

		w.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), as.AgentCode)
		w.SetCellStyle(sheet2, fmt.Sprintf("B%d", curRow), fmt.Sprintf("B%d", curRow), cSt)

		w.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), as.ActiveCount)
		w.SetCellStyle(sheet2, fmt.Sprintf("C%d", curRow), fmt.Sprintf("C%d", curRow), cSt)

		w.SetCellValue(sheet2, fmt.Sprintf("D%d", curRow), as.SoldCount)
		w.SetCellStyle(sheet2, fmt.Sprintf("D%d", curRow), fmt.Sprintf("D%d", curRow), cSt)

		w.SetCellValue(sheet2, fmt.Sprintf("E%d", curRow), as.RentedCount)
		w.SetCellStyle(sheet2, fmt.Sprintf("E%d", curRow), fmt.Sprintf("E%d", curRow), cSt)

		w.SetCellValue(sheet2, fmt.Sprintf("F%d", curRow), as.DraftCount)
		w.SetCellStyle(sheet2, fmt.Sprintf("F%d", curRow), fmt.Sprintf("F%d", curRow), cSt)

		w.SetCellValue(sheet2, fmt.Sprintf("G%d", curRow), as.TotalCount)
		w.SetCellStyle(sheet2, fmt.Sprintf("G%d", curRow), fmt.Sprintf("G%d", curRow), cSt)
	}

	// Widths for Sheet 2
	w.SetColWidth(sheet2, "A", "A", 28)
	w.SetColWidth(sheet2, "B", "B", 18)
	w.SetColWidth(sheet2, "C", "C", 14)
	w.SetColWidth(sheet2, "D", "D", 14)
	w.SetColWidth(sheet2, "E", "E", 14)
	w.SetColWidth(sheet2, "F", "F", 14)
	w.SetColWidth(sheet2, "G", "G", 16)

	if w.err != nil {
		return nil, fmt.Errorf("gagal menyusun dokumen excel: %w", w.err)
	}

	return f, nil
}
