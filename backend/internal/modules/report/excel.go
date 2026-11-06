package report

import (
	"fmt"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// GenerateExcel menghasilkan workbook excelize sesuai spesifikasi PRD §6.6.
func GenerateExcel(rows []ExportPropertyRow, stats *SummaryStats, adminName string, filterDesc string, siteURL string) (*excelize.File, error) {
	f := excelize.NewFile()

	sheet1 := "Daftar Properti"
	sheet2 := "Ringkasan"

	// Rename default sheet
	_ = f.SetSheetName("Sheet1", sheet1)
	_, _ = f.NewSheet(sheet2)

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
	_ = f.MergeCell(sheet1, "A1", "AD1")
	_ = f.SetCellValue(sheet1, "A1", "Laporan Data Properti — MasterPro Real Estate")
	_ = f.SetCellStyle(sheet1, "A1", "AD1", titleStyle)
	_ = f.SetRowHeight(sheet1, 1, 28)

	// Row 2: Metadata Creator
	_ = f.SetCellValue(sheet1, "A2", fmt.Sprintf("Dibuat: %s oleh %s", dateStr, adminName))
	_ = f.SetCellStyle(sheet1, "A2", "AD2", metaStyle)
	_ = f.SetRowHeight(sheet1, 2, 18)

	// Row 3: Filter Summary
	_ = f.SetCellValue(sheet1, "A3", fmt.Sprintf("Filter: %s", filterDesc))
	_ = f.SetCellStyle(sheet1, "A3", "AD3", metaStyle)
	_ = f.SetRowHeight(sheet1, 3, 18)

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
		f.SetCellValue(sheet1, cell, h)
	}
	f.SetCellStyle(sheet1, "A5", "AD5", headerStyle)
	f.SetRowHeight(sheet1, 5, 26)

	// Freeze pane below Row 5
	_ = f.SetPanes(sheet1, &excelize.Panes{
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

		f.SetRowHeight(sheet1, rowNum, 20)

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
		f.SetCellValue(sheet1, fmt.Sprintf("A%d", rowNum), i+1)
		f.SetCellStyle(sheet1, fmt.Sprintf("A%d", rowNum), fmt.Sprintf("A%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("B%d", rowNum), r.Code)
		f.SetCellStyle(sheet1, fmt.Sprintf("B%d", rowNum), fmt.Sprintf("B%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("C%d", rowNum), r.Title)
		f.SetCellStyle(sheet1, fmt.Sprintf("C%d", rowNum), fmt.Sprintf("C%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("D%d", rowNum), r.ListingType)
		f.SetCellStyle(sheet1, fmt.Sprintf("D%d", rowNum), fmt.Sprintf("D%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("E%d", rowNum), r.MarketType)
		f.SetCellStyle(sheet1, fmt.Sprintf("E%d", rowNum), fmt.Sprintf("E%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("F%d", rowNum), r.PropertyTypeName)
		f.SetCellStyle(sheet1, fmt.Sprintf("F%d", rowNum), fmt.Sprintf("F%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("G%d", rowNum), r.Province)
		f.SetCellStyle(sheet1, fmt.Sprintf("G%d", rowNum), fmt.Sprintf("G%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("H%d", rowNum), r.City)
		f.SetCellStyle(sheet1, fmt.Sprintf("H%d", rowNum), fmt.Sprintf("H%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("I%d", rowNum), r.District)
		f.SetCellStyle(sheet1, fmt.Sprintf("I%d", rowNum), fmt.Sprintf("I%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("J%d", rowNum), r.Address)
		f.SetCellStyle(sheet1, fmt.Sprintf("J%d", rowNum), fmt.Sprintf("J%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("K%d", rowNum), r.Price)
		f.SetCellStyle(sheet1, fmt.Sprintf("K%d", rowNum), fmt.Sprintf("K%d", rowNum), pStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("L%d", rowNum), r.RentPeriod)
		f.SetCellStyle(sheet1, fmt.Sprintf("L%d", rowNum), fmt.Sprintf("L%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("M%d", rowNum), nego)
		f.SetCellStyle(sheet1, fmt.Sprintf("M%d", rowNum), fmt.Sprintf("M%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("N%d", rowNum), ltVal)
		if r.LandArea != nil {
			f.SetCellStyle(sheet1, fmt.Sprintf("N%d", rowNum), fmt.Sprintf("N%d", rowNum), aStyle)
		} else {
			f.SetCellStyle(sheet1, fmt.Sprintf("N%d", rowNum), fmt.Sprintf("N%d", rowNum), cStyle)
		}

		f.SetCellValue(sheet1, fmt.Sprintf("O%d", rowNum), lbVal)
		if r.BuildingArea != nil {
			f.SetCellStyle(sheet1, fmt.Sprintf("O%d", rowNum), fmt.Sprintf("O%d", rowNum), aStyle)
		} else {
			f.SetCellStyle(sheet1, fmt.Sprintf("O%d", rowNum), fmt.Sprintf("O%d", rowNum), cStyle)
		}

		f.SetCellValue(sheet1, fmt.Sprintf("P%d", rowNum), ktVal)
		f.SetCellStyle(sheet1, fmt.Sprintf("P%d", rowNum), fmt.Sprintf("P%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("Q%d", rowNum), kmVal)
		f.SetCellStyle(sheet1, fmt.Sprintf("Q%d", rowNum), fmt.Sprintf("Q%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("R%d", rowNum), r.Certificate)
		f.SetCellStyle(sheet1, fmt.Sprintf("R%d", rowNum), fmt.Sprintf("R%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("S%d", rowNum), r.Furnishing)
		f.SetCellStyle(sheet1, fmt.Sprintf("S%d", rowNum), fmt.Sprintf("S%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("T%d", rowNum), r.Status)
		f.SetCellStyle(sheet1, fmt.Sprintf("T%d", rowNum), fmt.Sprintf("T%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("U%d", rowNum), r.AgentName)
		f.SetCellStyle(sheet1, fmt.Sprintf("U%d", rowNum), fmt.Sprintf("U%d", rowNum), dStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("V%d", rowNum), r.AgentCode)
		f.SetCellStyle(sheet1, fmt.Sprintf("V%d", rowNum), fmt.Sprintf("V%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("W%d", rowNum), r.AgentWhatsapp)
		f.SetCellStyle(sheet1, fmt.Sprintf("W%d", rowNum), fmt.Sprintf("W%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("X%d", rowNum), r.ViewCount)
		f.SetCellStyle(sheet1, fmt.Sprintf("X%d", rowNum), fmt.Sprintf("X%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("Y%d", rowNum), r.WhatsappClickCount)
		f.SetCellStyle(sheet1, fmt.Sprintf("Y%d", rowNum), fmt.Sprintf("Y%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("Z%d", rowNum), publishedStr)
		f.SetCellStyle(sheet1, fmt.Sprintf("Z%d", rowNum), fmt.Sprintf("Z%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("AA%d", rowNum), closedStr)
		f.SetCellStyle(sheet1, fmt.Sprintf("AA%d", rowNum), fmt.Sprintf("AA%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("AB%d", rowNum), createdStr)
		f.SetCellStyle(sheet1, fmt.Sprintf("AB%d", rowNum), fmt.Sprintf("AB%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("AC%d", rowNum), updatedStr)
		f.SetCellStyle(sheet1, fmt.Sprintf("AC%d", rowNum), fmt.Sprintf("AC%d", rowNum), cStyle)

		f.SetCellValue(sheet1, fmt.Sprintf("AD%d", rowNum), pubURL)
		f.SetCellStyle(sheet1, fmt.Sprintf("AD%d", rowNum), fmt.Sprintf("AD%d", rowNum), dStyle)
	}

	// AutoFilter
	lastDataRow := rowStart + len(rows) - 1
	if len(rows) == 0 {
		lastDataRow = 5
	}
	_ = f.AutoFilter(sheet1, fmt.Sprintf("A5:AD%d", lastDataRow), []excelize.AutoFilterOptions{})

	// Footer Row (Baris Akhir Total)
	footerRow := lastDataRow + 1
	_ = f.SetRowHeight(sheet1, footerRow, 24)

	_ = f.MergeCell(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("J%d", footerRow))
	_ = f.SetCellValue(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("TOTAL: %d LISTING (Total Nilai Properti Tayang Dijual: Rp)", len(rows)))
	_ = f.SetCellStyle(sheet1, fmt.Sprintf("A%d", footerRow), fmt.Sprintf("J%d", footerRow), footerStyle)

	_ = f.SetCellValue(sheet1, fmt.Sprintf("K%d", footerRow), totalActiveSalePrice)
	_ = f.SetCellStyle(sheet1, fmt.Sprintf("K%d", footerRow), fmt.Sprintf("K%d", footerRow), footerPriceStyle)

	_ = f.MergeCell(sheet1, fmt.Sprintf("L%d", footerRow), fmt.Sprintf("AD%d", footerRow))
	_ = f.SetCellStyle(sheet1, fmt.Sprintf("L%d", footerRow), fmt.Sprintf("AD%d", footerRow), footerStyle)

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
		_ = f.SetColWidth(sheet1, col, col, width)
	}

	// ==========================================
	// 3. SHEET 2: RINGKASAN
	// ==========================================
	f.MergeCell(sheet2, "A1", "H1")
	f.SetCellValue(sheet2, "A1", "Ringkasan & Statistik Data Properti")
	f.SetCellStyle(sheet2, "A1", "H1", titleStyle)
	f.SetRowHeight(sheet2, 1, 26)

	f.SetCellValue(sheet2, "A2", fmt.Sprintf("Data per %s", dateStr))
	f.SetCellStyle(sheet2, "A2", "H2", metaStyle)
	f.SetRowHeight(sheet2, 2, 18)

	// Section 1: Berdasarkan Status
	f.SetCellValue(sheet2, "A4", "1. Rekapitulasi Berdasarkan Status")
	f.SetCellStyle(sheet2, "A4", "A4", titleStyle)

	f.SetCellValue(sheet2, "A5", "Status")
	f.SetCellValue(sheet2, "B5", "Jumlah Listing")
	f.SetCellValue(sheet2, "C5", "Persentase")
	f.SetCellStyle(sheet2, "A5", "C5", headerStyle)
	f.SetRowHeight(sheet2, 5, 22)

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
		f.SetCellValue(sheet2, fmt.Sprintf("A%d", rNum), sd.Label)
		f.SetCellValue(sheet2, fmt.Sprintf("B%d", rNum), sd.Count)
		f.SetCellValue(sheet2, fmt.Sprintf("C%d", rNum), pct)
		f.SetCellStyle(sheet2, fmt.Sprintf("A%d", rNum), fmt.Sprintf("C%d", rNum), st)
	}

	totStatusRow := 6 + len(statusData)
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", totStatusRow), "Total Listing")
	f.SetCellValue(sheet2, fmt.Sprintf("B%d", totStatusRow), stats.TotalCount)
	f.SetCellValue(sheet2, fmt.Sprintf("C%d", totStatusRow), "100.0%")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", totStatusRow), fmt.Sprintf("C%d", totStatusRow), footerStyle)

	// Section 2: Berdasarkan Transaksi & Tipe
	curRow := totStatusRow + 2
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "2. Rekapitulasi Transaksi (Jual / Sewa)")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Jenis Transaksi")
	f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Jumlah Listing")
	f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Persentase")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), headerStyle)

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
		f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), td.Label)
		f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), td.Count)
		f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), pct)
		f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), st)
	}

	// Section 3: Berdasarkan Tipe Properti
	curRow += 2
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "3. Rekapitulasi Tipe Properti")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Tipe Properti")
	f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Jumlah Listing")
	f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Persentase")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), headerStyle)

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
		f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), tc.TypeName)
		f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), tc.Count)
		f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), pct)
		f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("C%d", curRow), st)
	}

	// Section 4: Performa Per Agen
	curRow += 2
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "4. Rekapitulasi Performa Mitra Agen")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), titleStyle)

	curRow++
	f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), "Nama Agen")
	f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), "Kode Agen")
	f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), "Tayang")
	f.SetCellValue(sheet2, fmt.Sprintf("D%d", curRow), "Terjual")
	f.SetCellValue(sheet2, fmt.Sprintf("E%d", curRow), "Tersewa")
	f.SetCellValue(sheet2, fmt.Sprintf("F%d", curRow), "Draf")
	f.SetCellValue(sheet2, fmt.Sprintf("G%d", curRow), "Total Listing")
	f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("G%d", curRow), headerStyle)

	for idx, as := range stats.AgentStats {
		curRow++
		st := dataStyleWhite
		cSt := centerStyleWhite
		if idx%2 == 1 {
			st = dataStyleZebra
			cSt = centerStyleZebra
		}
		f.SetCellValue(sheet2, fmt.Sprintf("A%d", curRow), as.AgentName)
		f.SetCellStyle(sheet2, fmt.Sprintf("A%d", curRow), fmt.Sprintf("A%d", curRow), st)

		f.SetCellValue(sheet2, fmt.Sprintf("B%d", curRow), as.AgentCode)
		f.SetCellStyle(sheet2, fmt.Sprintf("B%d", curRow), fmt.Sprintf("B%d", curRow), cSt)

		f.SetCellValue(sheet2, fmt.Sprintf("C%d", curRow), as.ActiveCount)
		f.SetCellStyle(sheet2, fmt.Sprintf("C%d", curRow), fmt.Sprintf("C%d", curRow), cSt)

		f.SetCellValue(sheet2, fmt.Sprintf("D%d", curRow), as.SoldCount)
		f.SetCellStyle(sheet2, fmt.Sprintf("D%d", curRow), fmt.Sprintf("D%d", curRow), cSt)

		f.SetCellValue(sheet2, fmt.Sprintf("E%d", curRow), as.RentedCount)
		f.SetCellStyle(sheet2, fmt.Sprintf("E%d", curRow), fmt.Sprintf("E%d", curRow), cSt)

		f.SetCellValue(sheet2, fmt.Sprintf("F%d", curRow), as.DraftCount)
		f.SetCellStyle(sheet2, fmt.Sprintf("F%d", curRow), fmt.Sprintf("F%d", curRow), cSt)

		f.SetCellValue(sheet2, fmt.Sprintf("G%d", curRow), as.TotalCount)
		f.SetCellStyle(sheet2, fmt.Sprintf("G%d", curRow), fmt.Sprintf("G%d", curRow), cSt)
	}

	// Widths for Sheet 2
	_ = f.SetColWidth(sheet2, "A", "A", 28)
	_ = f.SetColWidth(sheet2, "B", "B", 18)
	_ = f.SetColWidth(sheet2, "C", "C", 14)
	_ = f.SetColWidth(sheet2, "D", "D", 14)
	_ = f.SetColWidth(sheet2, "E", "E", 14)
	_ = f.SetColWidth(sheet2, "F", "F", 14)
	_ = f.SetColWidth(sheet2, "G", "G", 16)

	return f, nil
}
