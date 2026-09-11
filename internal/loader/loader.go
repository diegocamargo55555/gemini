package loader

import (
	"fmt"
	"os"
	"sort"

	"portfolio/internal/domain"
	"gopkg.in/yaml.v3"
)

type ProjectsFile struct {
	Projects []domain.Project `yaml:"projects"`
}

// LoadProjectsFromFile carrega e valida projetos de um arquivo YAML
func LoadProjectsFromFile(filePath string) ([]domain.Project, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("falha ao ler arquivo %s: %w", filePath, err)
	}

	var pf ProjectsFile
	if err := yaml.Unmarshal(data, &pf); err != nil {
		return nil, fmt.Errorf("falha ao interpretar YAML: %w", err)
	}

	for i := range pf.Projects {
		if err := pf.Projects[i].Validate(); err != nil {
			return nil, fmt.Errorf("projeto inválido no índice %d: %w", i, err)
		}
	}

	// Ordena por Order crescente
	sort.SliceStable(pf.Projects, func(i, j int) bool {
		return pf.Projects[i].Order < pf.Projects[j].Order
	})

	return pf.Projects, nil
}
