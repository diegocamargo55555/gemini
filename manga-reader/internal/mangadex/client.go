package mangadex

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"manga-reader/internal/domain"
)

const (
	BaseAPIURL = "https://api.mangadex.org"
	CoverBase  = "https://uploads.mangadex.org/covers"
)

type Client struct {
	httpClient *http.Client
	baseURL    string
	cache      *MemoryCache
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
		baseURL: BaseAPIURL,
		cache:   NewMemoryCache(),
	}
}

// MangaListResult contains list of mangas and pagination metadata
type MangaListResult struct {
	Data   []*domain.Manga `json:"data"`
	Total  int             `json:"total"`
	Limit  int             `json:"limit"`
	Offset int             `json:"offset"`
}

// Raw MangaDex API response structures
type mdResponse struct {
	Result   string          `json:"result"`
	Response string          `json:"response"`
	Data     json.RawMessage `json:"data"`
	Limit    int             `json:"limit"`
	Offset   int             `json:"offset"`
	Total    int             `json:"total"`
	Errors   []struct {
		ID     string `json:"id"`
		Status int    `json:"status"`
		Title  string `json:"title"`
		Detail string `json:"detail"`
	} `json:"errors"`
}

type mdMangaItem struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	Attributes struct {
		Title                  map[string]string   `json:"title"`
		AltTitles              []map[string]string `json:"altTitles"`
		Description            map[string]string   `json:"description"`
		Status                 string              `json:"status"`
		Year                   int                 `json:"year"`
		ContentRating          string              `json:"contentRating"`
		OriginalLanguage       string              `json:"originalLanguage"`
		LatestUploadedChapter  string              `json:"latestUploadedChapter"`
		Tags                   []mdTagItem         `json:"tags"`
	} `json:"attributes"`
	Relationships []mdRelationship `json:"relationships"`
}

type mdTagItem struct {
	ID         string `json:"id"`
	Attributes struct {
		Name  map[string]string `json:"name"`
		Group string            `json:"group"`
	} `json:"attributes"`
}

type mdRelationship struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Attributes map[string]interface{} `json:"attributes"`
}

type mdChapterItem struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	Attributes struct {
		Volume             string    `json:"volume"`
		Chapter            string    `json:"chapter"`
		Title              string    `json:"title"`
		TranslatedLanguage string    `json:"translatedLanguage"`
		PublishAt          time.Time `json:"publishAt"`
		Pages              int       `json:"pages"`
		ExternalURL        *string   `json:"externalUrl"`
	} `json:"attributes"`
	Relationships []mdRelationship `json:"relationships"`
}

type mdAtHomeResponse struct {
	Result  string `json:"result"`
	BaseURL string `json:"baseUrl"`
	Chapter struct {
		Hash      string   `json:"hash"`
		Data      []string `json:"data"`
		DataSaver []string `json:"dataSaver"`
	} `json:"chapter"`
}

// SearchManga fetches mangas matching filters
func (c *Client) SearchManga(ctx context.Context, filter domain.MangaFilter) (*MangaListResult, error) {
	filter.SetDefaults()

	cacheKey := fmt.Sprintf("manga:q=%s:o=%s:%s:l=%d:off=%d:tags=%s",
		filter.Query, filter.Order, filter.OrderDir, filter.Limit, filter.Offset, strings.Join(filter.Tags, ","))
	if cached, ok := c.cache.Get(cacheKey); ok {
		return cached.(*MangaListResult), nil
	}

	params := url.Values{}
	params.Set("limit", strconv.Itoa(filter.Limit))
	params.Set("offset", strconv.Itoa(filter.Offset))
	params.Add("includes[]", "cover_art")
	params.Add("includes[]", "author")
	params.Add("includes[]", "artist")
	params.Add("contentRating[]", "safe")
	params.Add("contentRating[]", "suggestive")

	if filter.Query != "" {
		params.Set("title", filter.Query)
	}

	orderKey := fmt.Sprintf("order[%s]", filter.Order)
	params.Set(orderKey, filter.OrderDir)

	for _, tag := range filter.Tags {
		if tag != "" {
			params.Add("includedTags[]", tag)
		}
	}

	reqURL := fmt.Sprintf("%s/manga?%s", c.baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "MangaReaderApp/1.0 (pair-programming-demo)")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("mangadex request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mangadex returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var mdResp mdResponse
	if err := json.NewDecoder(resp.Body).Decode(&mdResp); err != nil {
		return nil, fmt.Errorf("failed to decode mangadex response: %w", err)
	}

	var items []mdMangaItem
	if err := json.Unmarshal(mdResp.Data, &items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal manga items: %w", err)
	}

	mangas := make([]*domain.Manga, 0, len(items))
	for _, item := range items {
		mangas = append(mangas, formatMangaItem(&item))
	}

	result := &MangaListResult{
		Data:   mangas,
		Total:  mdResp.Total,
		Limit:  mdResp.Limit,
		Offset: mdResp.Offset,
	}

	c.cache.Set(cacheKey, result, 5*time.Minute)
	return result, nil
}

// GetMangaByID retrieves a single manga by its ID
func (c *Client) GetMangaByID(ctx context.Context, id string) (*domain.Manga, error) {
	cacheKey := "manga_detail:" + id
	if cached, ok := c.cache.Get(cacheKey); ok {
		return cached.(*domain.Manga), nil
	}

	params := url.Values{}
	params.Add("includes[]", "cover_art")
	params.Add("includes[]", "author")
	params.Add("includes[]", "artist")

	reqURL := fmt.Sprintf("%s/manga/%s?%s", c.baseURL, id, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "MangaReaderApp/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, domain.ErrMangaNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mangadex status %d", resp.StatusCode)
	}

	var mdResp struct {
		Result string      `json:"result"`
		Data   mdMangaItem `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&mdResp); err != nil {
		return nil, err
	}

	manga := formatMangaItem(&mdResp.Data)
	c.cache.Set(cacheKey, manga, 15*time.Minute)
	return manga, nil
}

// GetMangaFeed fetches chapters for a manga
func (c *Client) GetMangaFeed(ctx context.Context, mangaID string, languages []string, order string, limit, offset int) ([]*domain.Chapter, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 100
	}
	if order == "" {
		order = "desc"
	}

	langKey := strings.Join(languages, ",")
	cacheKey := fmt.Sprintf("chapters:%s:l=%s:ord=%s:lim=%d:off=%d", mangaID, langKey, order, limit, offset)
	type feedCache struct {
		Chapters []*domain.Chapter
		Total    int
	}
	if cached, ok := c.cache.Get(cacheKey); ok {
		fc := cached.(feedCache)
		return fc.Chapters, fc.Total, nil
	}

	params := url.Values{}
	params.Set("limit", strconv.Itoa(limit))
	params.Set("offset", strconv.Itoa(offset))
	params.Set("order[chapter]", order)
	params.Add("contentRating[]", "safe")
	params.Add("contentRating[]", "suggestive")
	params.Add("contentRating[]", "erotica")
	params.Add("includes[]", "scanlation_group")

	if len(languages) > 0 {
		for _, lang := range languages {
			params.Add("translatedLanguage[]", lang)
		}
	} else {
		params.Add("translatedLanguage[]", "pt-br")
		params.Add("translatedLanguage[]", "en")
	}

	reqURL := fmt.Sprintf("%s/manga/%s/feed?%s", c.baseURL, mangaID, params.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("User-Agent", "MangaReaderApp/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("mangadex feed status %d", resp.StatusCode)
	}

	var mdResp struct {
		Result string          `json:"result"`
		Data   []mdChapterItem `json:"data"`
		Total  int             `json:"total"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&mdResp); err != nil {
		return nil, 0, err
	}

	chapters := make([]*domain.Chapter, 0, len(mdResp.Data))
	for _, item := range mdResp.Data {
		groupName := ""
		for _, rel := range item.Relationships {
			if rel.Type == "scanlation_group" && rel.Attributes != nil {
				if name, ok := rel.Attributes["name"].(string); ok {
					groupName = name
				}
			}
		}

		var extURL string
		if item.Attributes.ExternalURL != nil {
			extURL = *item.Attributes.ExternalURL
		}

		chapters = append(chapters, &domain.Chapter{
			ID:              item.ID,
			MangaID:         mangaID,
			Volume:          item.Attributes.Volume,
			Chapter:         item.Attributes.Chapter,
			Title:           item.Attributes.Title,
			Language:        item.Attributes.TranslatedLanguage,
			PublishAt:       item.Attributes.PublishAt,
			Pages:           item.Attributes.Pages,
			ScanlationGroup: groupName,
			ExternalURL:     extURL,
		})
	}

	c.cache.Set(cacheKey, feedCache{Chapters: chapters, Total: mdResp.Total}, 10*time.Minute)
	return chapters, mdResp.Total, nil
}

// GetChapterPages retrieves the image pages using MangaDex At-Home server
func (c *Client) GetChapterPages(ctx context.Context, chapterID string) (*domain.ChapterPages, error) {
	cacheKey := "chapter_pages:" + chapterID
	if cached, ok := c.cache.Get(cacheKey); ok {
		return cached.(*domain.ChapterPages), nil
	}

	reqURL := fmt.Sprintf("%s/at-home/server/%s", c.baseURL, chapterID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "MangaReaderApp/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, domain.ErrChapterNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("at-home status %d", resp.StatusCode)
	}

	var atHomeResp mdAtHomeResponse
	if err := json.NewDecoder(resp.Body).Decode(&atHomeResp); err != nil {
		return nil, err
	}

	pages := make([]string, len(atHomeResp.Chapter.Data))
	for i, f := range atHomeResp.Chapter.Data {
		pages[i] = fmt.Sprintf("%s/data/%s/%s", atHomeResp.BaseURL, atHomeResp.Chapter.Hash, f)
	}

	dataSaver := make([]string, len(atHomeResp.Chapter.DataSaver))
	for i, f := range atHomeResp.Chapter.DataSaver {
		dataSaver[i] = fmt.Sprintf("%s/data-saver/%s/%s", atHomeResp.BaseURL, atHomeResp.Chapter.Hash, f)
	}

	result := &domain.ChapterPages{
		ChapterID: chapterID,
		BaseURL:   atHomeResp.BaseURL,
		Hash:      atHomeResp.Chapter.Hash,
		Pages:     pages,
		DataSaver: dataSaver,
	}

	c.cache.Set(cacheKey, result, 1*time.Hour)
	return result, nil
}

// GetTags retrieves all available genre/theme tags
func (c *Client) GetTags(ctx context.Context) ([]domain.Tag, error) {
	cacheKey := "mangadex_tags"
	if cached, ok := c.cache.Get(cacheKey); ok {
		return cached.([]domain.Tag), nil
	}

	reqURL := fmt.Sprintf("%s/manga/tag", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "MangaReaderApp/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tags status %d", resp.StatusCode)
	}

	var mdResp struct {
		Result string      `json:"result"`
		Data   []mdTagItem `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&mdResp); err != nil {
		return nil, err
	}

	tags := make([]domain.Tag, 0, len(mdResp.Data))
	for _, item := range mdResp.Data {
		name := item.Attributes.Name["en"]
		if name == "" {
			for _, v := range item.Attributes.Name {
				name = v
				break
			}
		}
		tags = append(tags, domain.Tag{
			ID:    item.ID,
			Name:  name,
			Group: item.Attributes.Group,
		})
	}

	c.cache.Set(cacheKey, tags, 24*time.Hour)
	return tags, nil
}

func formatMangaItem(item *mdMangaItem) *domain.Manga {
	// Pick title: pt-br, then en, then ja-ro, then first available
	title := item.Attributes.Title["pt-br"]
	if title == "" {
		title = item.Attributes.Title["en"]
	}
	if title == "" {
		title = item.Attributes.Title["ja-ro"]
	}
	if title == "" {
		for _, v := range item.Attributes.Title {
			title = v
			break
		}
	}

	// Pick description: pt-br, then en, then first available
	desc := item.Attributes.Description["pt-br"]
	if desc == "" {
		desc = item.Attributes.Description["en"]
	}
	if desc == "" {
		for _, v := range item.Attributes.Description {
			desc = v
			break
		}
	}

	// Extract cover, authors, artists
	var coverURL string
	var authors []string
	var artists []string

	for _, rel := range item.Relationships {
		switch rel.Type {
		case "cover_art":
			if fn, ok := rel.Attributes["fileName"].(string); ok && fn != "" {
				coverURL = fmt.Sprintf("%s/%s/%s.512.jpg", CoverBase, item.ID, fn)
			}
		case "author":
			if name, ok := rel.Attributes["name"].(string); ok && name != "" {
				authors = append(authors, name)
			}
		case "artist":
			if name, ok := rel.Attributes["name"].(string); ok && name != "" {
				artists = append(artists, name)
			}
		}
	}

	// Extract tag names
	tagNames := make([]string, 0, len(item.Attributes.Tags))
	for _, t := range item.Attributes.Tags {
		name := t.Attributes.Name["en"]
		if name != "" {
			tagNames = append(tagNames, name)
		}
	}

	// Extract alt titles
	altTitles := make([]string, 0, len(item.Attributes.AltTitles))
	for _, at := range item.Attributes.AltTitles {
		for _, v := range at {
			if v != "" && v != title {
				altTitles = append(altTitles, v)
				break
			}
		}
	}

	return &domain.Manga{
		ID:               item.ID,
		Title:            title,
		AltTitles:        altTitles,
		Description:      desc,
		CoverURL:         coverURL,
		Status:           item.Attributes.Status,
		Year:             item.Attributes.Year,
		ContentRating:    item.Attributes.ContentRating,
		Tags:             tagNames,
		OriginalLanguage: item.Attributes.OriginalLanguage,
		Authors:          authors,
		Artists:          artists,
		LatestChapter:    item.Attributes.LatestUploadedChapter,
	}
}
